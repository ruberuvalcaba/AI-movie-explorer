// Production HTTP tests: mock Supabase Auth + real local PostgreSQL profile/saved-movie/RLS operations.
// No real account is created and no remote database is contacted.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { once } from 'node:events';
import { PGlite } from '@electric-sql/pglite';
import { defaultSerovalDeserializerPlugins } from '@tanstack/react-start';
import { toJSON, fromCrossJSON } from 'seroval';

const user = { id: '11111111-1111-4111-8111-111111111111', email: 'test@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const otherUser = { ...user, id: '22222222-2222-4222-8222-222222222222', email: 'other@example.com' };
const expiresAt = Math.floor(Date.now() / 1000) + 3600;
const jwtFor = current => `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: current.id, aud: 'authenticated', exp: expiresAt })).toString('base64url')}.signature`;
const jwt = jwtFor(user);
const otherJwt = jwtFor(otherUser);
const userForToken = token => token === jwt ? user : token === otherJwt ? otherUser : null;
const revoked = new Set();
let confirmationRequired = true;
let profileFailure = false;
let watchlistFailure = false;
let watchlistWrites = 0;
let signupRequests = 0;
let currentPassword = 'password123';
let recoveryRequests = 0;
let passwordUpdates = 0;
let recoveryStatus = 200;
let passwordUpdateError = null;
let latestRecoveryRedirect = '';
const summaryFetches = new Map();
let tmdbFailure = false;
let profileWrites = 0;
let latestRedirect = '';
const usedConfirmations = new Set();
const session = (current = user) => ({ access_token: jwtFor(current), refresh_token: `test-refresh-${current.id}`, token_type: 'bearer', expires_in: 3600, user: current });
const db = new PGlite();
await db.exec(`
 create role anon nologin;
 create role authenticated nologin;
 create schema auth;
 create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as
 $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
 grant usage on schema auth to anon, authenticated;
 grant execute on function auth.uid() to anon, authenticated;
`);
for (const name of (await readdir('supabase/migrations')).filter(name => name.endsWith('.sql')).sort()) {
 await db.exec(await readFile(`supabase/migrations/${name}`, 'utf8'));
}
await db.query('insert into auth.users (id,email) values ($1,$2)', [otherUser.id, otherUser.email]);
await db.query('update public.profiles set display_name=$1 where id=$2', ['Other User', otherUser.id]);

const mock = createServer(async (req, res) => {
 try {
  let body = ''; for await (const chunk of req) body += chunk;
  const input = body ? JSON.parse(body) : {};
  const url = new URL(req.url, 'http://mock.local');
  const token = req.headers.authorization?.replace(/^Bearer /, '') ?? '';
  const authenticated = userForToken(token);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Supabase-Api-Version', '2024-01-01');
  const send = (status, value) => { res.writeHead(status); res.end(JSON.stringify(value)); };
  if (/^\/3\/movie\/\d+$/.test(url.pathname)) {
   const id = Number(url.pathname.split('/').at(-1));
   const summary = !url.searchParams.has('append_to_response');
   if (summary) summaryFetches.set(id, (summaryFetches.get(id) ?? 0) + 1);
   await new Promise(resolve => setTimeout(resolve, 20));
   if (tmdbFailure) { send(503, { message: 'TMDB unavailable' }); return; }
   send(200, { id, title: `Movie ${id}`, poster_path: null, release_date: '2026-01-01', vote_average: 7.5,
    overview: 'Test movie', backdrop_path: null, vote_count: 10, genres: [], original_language: 'en', runtime: 100,
    videos: { results: [] } });
  } else if (url.pathname === '/auth/v1/token') {
   const grant = url.searchParams.get('grant_type');
   const current = input.email === otherUser.email || input.refresh_token === `test-refresh-${otherUser.id}` ? otherUser : user;
   if (grant === 'pkce') {
    if (input.auth_code !== 'valid-code' || !input.code_verifier) { send(400, { code: 'bad_code_verifier', message: 'Invalid code' }); return; }
   } else if (input.password !== (current.id === user.id ? currentPassword : 'password123') && input.refresh_token !== `test-refresh-${current.id}`) {
    send(400, { code: 'invalid_credentials', message: 'Invalid credentials' }); return;
   }
   revoked.delete(current.id); send(200, session(current));
  } else if (url.pathname === '/auth/v1/signup') {
   signupRequests++;
   latestRedirect = url.searchParams.get('redirect_to') ?? '';
   await db.query('insert into auth.users (id,email,raw_user_meta_data) values ($1,$2,$3) on conflict (id) do nothing', [user.id, user.email, JSON.stringify(input.data ?? {})]);
   if (confirmationRequired) send(200, { user, session: null });
   else { revoked.delete(user.id); send(200, session()); }
  } else if (url.pathname === '/auth/v1/recover') {
   recoveryRequests++;
   latestRecoveryRedirect = url.searchParams.get('redirect_to') ?? '';
   if (recoveryStatus !== 200) { send(recoveryStatus, { code: recoveryStatus === 429 ? 'over_email_send_rate_limit' : 'email_not_found', message: 'Provider detail must not reach the client' }); return; }
   send(200, {});
  } else if (url.pathname === '/auth/v1/verify') {
   if (!String(input.token_hash).startsWith(input.type === 'recovery' ? 'valid-recovery-' : 'valid-confirmation-') || usedConfirmations.has(input.token_hash)) {
    send(400, { code: 'otp_expired', message: 'Token expired' }); return;
   }
   usedConfirmations.add(input.token_hash); revoked.delete(user.id); send(200, session());
  } else if (url.pathname === '/auth/v1/user' && authenticated && !revoked.has(authenticated.id)) {
   if (req.method === 'PUT') {
    passwordUpdates++;
    assert.ok(Object.keys(input).every(key => ['password', 'code_challenge', 'code_challenge_method'].includes(key)), 'Password update sends only password and SDK PKCE fields, never caller-supplied identity');
    if (passwordUpdateError) { send(422, { code: passwordUpdateError, message: 'Provider detail must not reach the client' }); return; }
    currentPassword = input.password;
   }
   send(200, authenticated);
  } else if (url.pathname === '/auth/v1/logout' && authenticated) {
   revoked.add(authenticated.id); res.writeHead(204); res.end();
  } else if (url.pathname === '/rest/v1/profiles') {
   if (!authenticated || revoked.has(authenticated.id)) { send(401, { message: 'Unauthorized' }); return; }
   if (profileFailure) { send(503, { code: 'PGRST000', message: 'Database unavailable' }); return; }
   const filter = url.searchParams.get('id');
   if (!/^eq\.[a-f0-9-]{36}$/.test(filter ?? '')) { send(400, { message: 'Expected ID filter' }); return; }
   const rows = await db.transaction(async tx => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [authenticated.id]);
    if (req.method === 'PATCH') {
     profileWrites++;
     assert.deepEqual(Object.keys(input), ['display_name'], 'Only display_name may be submitted to PostgREST');
     return (await tx.query('update public.profiles set display_name=$1 where id=$2 returning *', [input.display_name, filter.slice(3)])).rows;
    }
    assert.equal(req.method, 'GET');
    return (await tx.query('select * from public.profiles where id=$1', [filter.slice(3)])).rows;
   });
   if (req.headers.accept?.includes('vnd.pgrst.object')) {
    if (!rows.length) { send(406, { code: 'PGRST116', message: 'No rows found', details: 'The result contains 0 rows' }); return; }
    send(200, rows[0]);
   } else send(200, rows);
  } else if (url.pathname === '/rest/v1/saved_movies') {
   if (!authenticated || revoked.has(authenticated.id)) { send(401, { message: 'Unauthorized' }); return; }
   if (watchlistFailure) { send(503, { code: 'PGRST000', message: 'Database unavailable' }); return; }
   const allowedColumns = ['user_id', 'tmdb_movie_id', 'added_at', 'category'];
   const projection = url.searchParams.get('select') ?? '*';
   const projectedColumns = projection === '*' ? allowedColumns : projection.split(',').map(column => column.trim());
   assert.ok(projectedColumns.every(column => allowedColumns.includes(column)), 'No metadata may be fetched from saved_movies');
   const values = [];
   const filters = [];
   for (const [column, filter] of url.searchParams) {
    if (!allowedColumns.includes(column)) continue;
    assert.ok(filter.startsWith('eq.'), `Supported equality filter for ${column}`);
    values.push(filter.slice(3)); filters.push(`${column}=$${values.length}`);
   }
   const where = filters.length ? ` where ${filters.join(' and ')}` : '';
   const order = (url.searchParams.get('order') ?? '').split(',').filter(Boolean).map(part => {
    const [column, direction] = part.split('.');
    assert.ok(allowedColumns.includes(column)); assert.ok(['asc', 'desc'].includes(direction));
    return `${column} ${direction}`;
   });
   try {
    let totalCount = 0;
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const requestedLimit = Number(url.searchParams.get('limit') ?? 127);
    // A lower project response cap must not cause skipped pagination boundaries.
    const limit = Math.min(requestedLimit, 127);
    const rows = await db.transaction(async tx => {
     await tx.exec('set local role authenticated');
     await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [authenticated.id]);
     if (req.method === 'POST') {
      watchlistWrites++;
      assert.deepEqual(Object.keys(input).sort(), ['category', 'tmdb_movie_id', 'user_id'], 'Only verified ownership and movie ID may be written');
      assert.equal(input.user_id, authenticated.id, 'Owner must come from verified identity');
      const ignoreDuplicate = req.headers.prefer?.includes('resolution=ignore-duplicates') ? ' on conflict do nothing' : '';
      // No RETURNING clause: INSERT grants need not imply metadata SELECT grants.
      await tx.query(`insert into public.saved_movies (user_id,tmdb_movie_id,category) values ($1,$2,$3)${ignoreDuplicate}`, [input.user_id, input.tmdb_movie_id, input.category]);
      return [];
     }
     if (req.method === 'DELETE') {
      watchlistWrites++;
      assert.equal(url.searchParams.get('user_id'), `eq.${authenticated.id}`, 'Deletes must filter the verified owner');
      assert.ok(url.searchParams.has('tmdb_movie_id'), 'Deletes target a single saved movie');
      assert.ok(['eq.watchlist', 'eq.favorites'].includes(url.searchParams.get('category')), 'Deletes target one category');
      await tx.query(`delete from public.saved_movies${where}`, values);
      return [];
     }
     assert.equal(req.method, 'GET');
     assert.ok(['eq.watchlist', 'eq.favorites'].includes(url.searchParams.get('category')), 'Reads target one category');
     assert.equal(url.searchParams.get('user_id'), `eq.${authenticated.id}`, 'Reads must filter the verified owner');
     const allRows = (await tx.query(`select ${projectedColumns.join(',')} from public.saved_movies${where}${order.length ? ` order by ${order.join(',')}` : ''}`, values)).rows;
     totalCount = allRows.length;
     return allRows.slice(offset, offset + limit);
    });
    if (req.headers.prefer?.includes('count=exact')) res.setHeader('Content-Range', rows.length ? `${offset}-${offset + rows.length - 1}/${totalCount}` : `*/${totalCount}`);
    if (req.headers.accept?.includes('vnd.pgrst.object')) {
     if (!rows.length) { send(406, { code: 'PGRST116', message: 'No rows found', details: 'The result contains 0 rows' }); return; }
     send(200, rows[0]);
    } else send(200, rows);
   } catch (error) {
    if (['23505', '23503', '42501', '23514'].includes(error.code)) { send(error.code === '42501' ? 403 : 409, { code: error.code, message: error.message }); return; }
    throw error;
   }
  } else send(401, { message: 'Invalid session' });
 } catch (error) {
  console.error('Mock Supabase failure:', error);
  res.writeHead(500); res.end(JSON.stringify({ message: 'Mock failure' }));
 }
});
mock.listen(0, '127.0.0.1'); await once(mock, 'listening');
const portProbe = createServer(); portProbe.listen(0, '127.0.0.1'); await once(portProbe, 'listening');
const port = portProbe.address().port; await new Promise(resolve => portProbe.close(resolve));
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['--import', './scripts/fixtures/mock-tmdb.mjs', '.output/server/index.mjs'], { env: { ...process.env, TEST_TMDB_URL: `http://127.0.0.1:${mock.address().port}`, TMDB_ACCESS_TOKEN: 'test-only-token', PORT: String(port), HOST: '127.0.0.1', VITE_SUPABASE_URL: `http://127.0.0.1:${mock.address().port}`, VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key', NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'] });
let output = ''; child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { output += chunk; });
try {
 for (let attempt = 0; ; attempt++) {
  try { await fetch(`${base}/login`); break; } catch (error) { if (attempt > 100) throw new Error(output, { cause: error }); await new Promise(resolve => setTimeout(resolve, 100)); }
 }
 const assets = 'node_modules/.nitro/vite/services/ssr/assets';
 const ids = {};
 for (const file of await readdir(assets)) {
  if (!/^(auth.functions|account.functions|profile.functions|collection.functions|recovery.functions|movie.functions)-/.test(file)) continue;
  const source = await readFile(`${assets}/${file}`, 'utf8');
  for (const match of source.matchAll(/id: "([a-f0-9]+)",\s*name: "([^"]+)"/g)) ids[match[2]] = match[1];
 }
 async function rpc(name, { method = 'GET', data, cookie = '', origin = base } = {}) {
  if (['getSavedMovies', 'addSavedMovie', 'removeSavedMovie'].includes(name)) data = { category: 'watchlist', ...data };
  assert.ok(ids[name], `Built server function ${name} exists`);
  const target = new URL(`${base}/_serverFn/${ids[name]}`);
  if (method === 'GET' && data !== undefined) target.searchParams.set('payload', JSON.stringify(toJSON({ data })));
  return fetch(target, {
   method, redirect: 'manual',
   headers: { 'Content-Type': 'application/json', 'x-tsr-serverFn': 'true', Origin: origin, Cookie: cookie },
   ...(method === 'POST' ? { body: JSON.stringify(toJSON({ data })) } : {}),
  });
 }
 const decode = async response => fromCrossJSON(await response.json(), { refs: new Map(), plugins: defaultSerovalDeserializerPlugins });
 const cookieJar = response => response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
 for (const path of ['/profile', '/watchlist', '/favorites']) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual' });
  assert.equal(response.status, 307, path);
  assert.equal(new URL(response.headers.get('location'), base).pathname, '/login');
 }
 const loginPage = await fetch(`${base}/login`);
 assert.equal(loginPage.status, 200, 'Login stays public');
 assert.ok((await loginPage.text()).includes('Forgot password?'), 'Login exposes email recovery');
 assert.equal((await rpc('getAccount')).status, 401);
 assert.equal((await rpc('updateProfile', { method: 'POST', data: { displayName: 'Anonymous' } })).status, 401);
 assert.equal((await rpc('getSavedMovies')).status, 401);
 assert.equal((await rpc('addSavedMovie', { method: 'POST', data: { movieId: 278 } })).status, 401);
 assert.equal((await rpc('removeSavedMovie', { method: 'POST', data: { movieId: 278 } })).status, 401);
 assert.equal((await rpc('signIn', { method: 'POST', origin: 'https://other.example', data: { email: user.email, password: 'password123' } })).status, 403);
 const failed = await decode(await rpc('signIn', { method: 'POST', data: { email: user.email, password: 'wrong' } }));
 assert.ok(failed.result.error);
 const invalidRegistration = await rpc('signUp', { method: 'POST', data: { email: 'not-an-email', password: 'short' } });
 const invalidRegistrationData = await decode(invalidRegistration);
 assert.ok(invalidRegistration.status >= 400 || invalidRegistrationData.error || invalidRegistrationData.result?.error, 'Invalid signup input rejected');
 assert.equal(signupRequests, 0, 'Invalid signup never reaches Supabase');
 const registration = await rpc('signUp', { method: 'POST', data: { email: user.email, password: 'password123', redirect: '/profile' } });
 assert.equal((await decode(registration)).result.confirmationRequired, true);
 const registrationCookies = cookieJar(registration);
 assert.equal((await db.query('select count(*)::int as count from public.profiles where id=$1', [user.id])).rows[0].count, 1, 'Signup trigger creates exactly one profile');
 assert.ok(latestRedirect.includes('/auth/confirm'), 'Signup sends confirmation to the app callback');
 let confirmationIndex = 0;
 const confirm = async (next = '/profile', extra = '') => fetch(`${base}/auth/confirm?token_hash=valid-confirmation-${++confirmationIndex}&next=${encodeURIComponent(next)}${extra}`, { redirect: 'manual' });
 const confirmed = await confirm('/profile');
 assert.equal(confirmed.status, 303);
 assert.equal(confirmed.headers.get('location'), '/profile');
 assert.match(cookieJar(confirmed), /auth-token/, 'Confirmation writes session cookies');
 const confirmedProfile = await fetch(`${base}/profile`, { headers: { Cookie: cookieJar(confirmed) }, redirect: 'manual' });
 assert.equal(confirmedProfile.status, 200, 'Confirmed user can load profile');
 for (const next of ['https://other.example/steal', '//other.example/steal', '/\\other.example/steal', '/%2f%2fother.example/steal', '/%5cother.example/steal', '/%0d%0aLocation:https://other.example', '/%6cogin', '/%2572egister', '/auth%2fconfirm']) {
  const response = await confirm(next);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), '/', `Reject unsafe confirmation redirect ${JSON.stringify(next)}`);
 }
 const defaultConfirmation = await fetch(`${base}/auth/confirm?token_hash=valid-confirmation-${++confirmationIndex}`, { redirect: 'manual' });
 assert.equal(defaultConfirmation.status, 303);
 assert.equal(defaultConfirmation.headers.get('location'), '/', 'Confirmation without a destination returns Home');
 const nestedRedirect = await confirm('/movie/278?from=confirmation#saved');
 assert.equal(nestedRedirect.headers.get('location'), '/movie/278?from=confirmation#saved', 'Safe app redirects preserve query strings and fragments');
 for (const suffix of ['', '?token_hash=expired-token', '?token_hash=valid-confirmation-invalid&type=magiclink']) {
  const response = await fetch(`${base}/auth/confirm${suffix}`, { redirect: 'manual' });
  assert.equal(response.status, 303);
  const target = new URL(response.headers.get('location'), base);
  assert.equal(target.pathname, '/login');
  assert.equal(target.searchParams.get('error'), 'confirmation_failed');
 }
 const pkce = await fetch(`${base}/auth/confirm?code=valid-code&next=%2Fprofile`, { headers: { Cookie: registrationCookies }, redirect: 'manual' });
 assert.equal(pkce.status, 303);
 assert.equal(pkce.headers.get('location'), '/profile', 'PKCE confirmation is supported');
 assert.match(cookieJar(pkce), /auth-token/);
 confirmationRequired = false;
 const immediateRegistration = await rpc('signUp', { method: 'POST', data: { email: user.email, password: 'password123' } });
 assert.equal((await decode(immediateRegistration)).result.confirmationRequired, false);
 assert.match(cookieJar(immediateRegistration), /auth-token/, 'Signup signs in when confirmation is disabled');
 confirmationRequired = true;
 const login = await rpc('signIn', { method: 'POST', data: { email: user.email, password: 'password123' } });
 assert.equal(login.status, 200); assert.equal((await decode(login)).result.error, null);
 const cookie = cookieJar(login); assert.match(cookie, /auth-token/);
 assert.match(login.headers.get('cache-control'), /no-store/);
 assert.ok(login.headers.getSetCookie().every(value => /Secure/i.test(value) && /SameSite=Lax/i.test(value)));
 const assertAccountMenu = async (html, label) => {
  assert.match(html, /aria-label="Account options"/, 'Authenticated header exposes the account menu');
  // Menu contents mount on interaction; verify its label source through Auth.
  const auth = (await decode(await rpc('getAuthStatus', { cookie }))).result;
  assert.equal(auth.user.displayName || auth.user.email, label, 'Account menu label uses display name with email fallback');
 };
 const defaultLoginReturn = await fetch(`${base}/login`, { headers: { Cookie: cookie }, redirect: 'manual' });
 assert.equal(defaultLoginReturn.status, 307);
 assert.equal(defaultLoginReturn.headers.get('location'), '/', 'Already signed-in login route defaults to Home');
 for (const destination of ['/movie/278?from=search#saved', '/?q=space', '/watchlist']) {
  const response = await fetch(`${base}/login?redirect=${encodeURIComponent(destination)}`, { headers: { Cookie: cookie }, redirect: 'manual' });
  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), destination, 'Sign-in preserves an explicit safe return destination');
 }
 const unsafeLoginReturn = await fetch(`${base}/login?redirect=${encodeURIComponent('https://other.example/steal')}`, { headers: { Cookie: cookie }, redirect: 'manual' });
 assert.equal(unsafeLoginReturn.status, 307);
 const normalizedReturn = new URL(unsafeLoginReturn.headers.get('location'), base);
 assert.equal(normalizedReturn.origin, base, 'Unsafe return destinations never leave this origin');
 if (normalizedReturn.pathname === '/login') {
  // TanStack first canonicalizes validated search parameters, before beforeLoad.
  assert.equal(normalizedReturn.searchParams.get('redirect'), '/');
  const homeReturn = await fetch(normalizedReturn, { headers: { Cookie: cookie }, redirect: 'manual' });
  assert.equal(homeReturn.status, 307);
  assert.equal(homeReturn.headers.get('location'), '/', 'Normalized unsafe return destination lands on Home');
 } else assert.equal(unsafeLoginReturn.headers.get('location'), '/', 'Unsafe sign-in destinations fall back to Home');
 const initialAuth = (await decode(await rpc('getAuthStatus', { cookie }))).result;
 assert.equal(initialAuth.user.id, user.id);
 assert.equal(initialAuth.user.displayName, '');
 await assertAccountMenu(await (await fetch(`${base}/profile`, { headers: { Cookie: cookie } })).text(), user.email);
 const cookieName = cookie.slice(0, cookie.indexOf('='));
 const oldSession = { ...session(), expires_at: Math.floor(Date.now() / 1000) - 60 };
 const expiredCookie = `${cookieName}=base64-${Buffer.from(JSON.stringify(oldSession)).toString('base64url')}`;
 const rotated = await rpc('getAccount', { cookie: expiredCookie });
 assert.equal((await decode(rotated)).result.id, user.id);
 assert.match(rotated.headers.get('set-cookie'), /auth-token/);
 assert.match(rotated.headers.get('cache-control'), /no-store/);
 const account = (await decode(await rpc('getAccount', { cookie }))).result;
 assert.equal(account.id, user.id);
 assert.equal(account.displayName, '');
 assert.equal(account.avatarUrl, null);
 const update = await decode(await rpc('updateProfile', { method: 'POST', cookie, data: { displayName: '  Movie Fan  ', id: otherUser.id, userId: otherUser.id } }));
 assert.equal(update.result.error, null);
 assert.equal(update.result.profile.displayName, 'Movie Fan');
 const namedAuth = (await decode(await rpc('getAuthStatus', { cookie }))).result;
 assert.equal(namedAuth.user.displayName, 'Movie Fan', 'Auth context loads the editable database display name');
 const saved = await db.query('select id,display_name from public.profiles order by id');
 assert.equal(saved.rows.find(row => row.id === user.id).display_name, 'Movie Fan');
 assert.equal(saved.rows.find(row => row.id === otherUser.id).display_name, 'Other User', 'Submitted identity cannot edit another profile');
 const writesBeforeInvalid = profileWrites;
 for (const displayName of ['', '    ', 'x'.repeat(101)]) {
  const response = await rpc('updateProfile', { method: 'POST', cookie, data: { displayName } });
  const result = await decode(response);
  assert.ok(response.status >= 400 || result.error || result.result?.error, 'Invalid display name rejected');
 }
 assert.equal(profileWrites, writesBeforeInvalid, 'Invalid names never reach database');
 assert.equal((await rpc('updateProfile', { method: 'POST', cookie, origin: 'https://other.example', data: { displayName: 'Cross site' } })).status, 403);
 profileFailure = true;
 const failedUpdate = await decode(await rpc('updateProfile', { method: 'POST', cookie, data: { displayName: 'Unavailable' } }));
 assert.ok(failedUpdate.result.error, 'Database errors are displayed as handled profile errors');
 profileFailure = false;
 const profile = await fetch(`${base}/profile`, { headers: { Cookie: cookie }, redirect: 'manual' });
 assert.equal(profile.status, 200);
 const profileHtml = await profile.text();
 assert.ok(profileHtml.includes(user.email));
 assert.ok(profileHtml.includes('Movie Fan'));
 await assertAccountMenu(profileHtml, 'Movie Fan');
 assert.match(profile.headers.get('cache-control'), /no-store/);
 // Separate documents with the same cookie model refresh and session restoration.
 const refreshed = await fetch(`${base}/profile`, { headers: { Cookie: cookie } });
 assert.equal(refreshed.status, 200); assert.ok((await refreshed.text()).includes('Movie Fan'));
 // Profile names are optional presentation data: blank names or unavailable
 // profile storage must not invalidate an otherwise verified Auth session.
 await db.query('update public.profiles set display_name=$1 where id=$2', ['  Movie Fan  ', user.id]);
 await assertAccountMenu(await (await fetch(`${base}/profile`, { headers: { Cookie: cookie } })).text(), 'Movie Fan');
 await db.query('update public.profiles set display_name=$1 where id=$2', ['   ', user.id]);
 await assertAccountMenu(await (await fetch(`${base}/profile`, { headers: { Cookie: cookie } })).text(), user.email);
 profileFailure = true;
 const degradedAuth = (await decode(await rpc('getAuthStatus', { cookie }))).result;
 assert.equal(degradedAuth.user.id, user.id, 'A profile read failure must not sign the user out');
 assert.equal(degradedAuth.user.email, user.email);
 await assertAccountMenu(await (await fetch(`${base}/profile`, { headers: { Cookie: cookie } })).text(), user.email);
 profileFailure = false;
 await db.query('update public.profiles set display_name=$1 where id=$2', ['Movie Fan', user.id]);
 const otherLogin = await rpc('signIn', { method: 'POST', data: { email: otherUser.email, password: 'password123' } });
 const otherCookie = cookieJar(otherLogin);
 const [ownAccount, anotherAccount, anonymousAccount] = await Promise.all([rpc('getAccount', { cookie }), rpc('getAccount', { cookie: otherCookie }), rpc('getAccount')]);
 assert.equal((await decode(ownAccount)).result.displayName, 'Movie Fan');
 assert.equal((await decode(anotherAccount)).result.displayName, 'Other User');
 assert.equal(anonymousAccount.status, 401, 'Concurrent anonymous request must stay anonymous');
 // Cards receive lightweight summaries; full details retain trailers separately.
 const summaryOptions = movieId => ({ data: { movieId } });
 const summary = (await decode(await rpc('getMovieSummaryServerFn', summaryOptions(900001)))).result;
 assert.deepEqual(Object.keys(summary).sort(), ['id', 'poster_path', 'release_date', 'title', 'vote_average']);
 const fullDetails = (await decode(await rpc('getMovieDetailsServerFn', summaryOptions(900001)))).result;
 assert.ok(fullDetails.videos && fullDetails.overview, 'Full details still include videos and overview');
 // A user's watchlist is implicit: no setup record or sample import exists.
 const resultOf = async (name, options = {}) => {
  const response = await rpc(name, options);
  assert.equal(response.status, 200, `${name} HTTP success`);
  const decoded = await decode(response);
  assert.equal(decoded.error, undefined, `${name} server success`);
  return decoded.result;
 };
 const denied = async (name, options, expectedStatus) => {
  const response = await rpc(name, options);
  if (expectedStatus !== undefined) assert.equal(response.status, expectedStatus, `${name} inaccessible`);
  else if (response.status < 400) {
   const decoded = await decode(response);
   assert.ok(decoded.error || decoded.result?.error, `${name} should reject invalid input`);
  }
 };
 tmdbFailure = true;
 await denied('getMovieSummaryServerFn', summaryOptions(900099));
 tmdbFailure = false;
 assert.equal((await resultOf('getMovieSummaryServerFn', summaryOptions(900099))).id, 900099, 'Failed summaries are retryable');
 for (const movieId of [0, -1, 1.5, 2147483648]) await denied('getMovieSummaryServerFn', summaryOptions(movieId));
 for (const obsolete of ['getWatchlists', 'getWatchlistMovies', 'createWatchlist', 'renameWatchlist', 'deleteWatchlist']) {
  assert.equal(ids[obsolete], undefined, `${obsolete} must not remain a callable server function`);
 }
 assert.equal((await db.query("select to_regclass('public.watchlists') as lists, to_regclass('public.watchlist_movies') as entries")).rows[0].lists, null);
 assert.equal((await db.query("select to_regclass('public.watchlist_movies') as entries")).rows[0].entries, null);
 assert.deepEqual(await resultOf('getSavedMovies', { cookie }), [], 'New account has an empty implicit watchlist');
 assert.equal((await db.query('select count(*)::int as count from public.saved_movies')).rows[0].count, 0, 'No sample movies saved');
 await resultOf('addSavedMovie', { method: 'POST', cookie, data: { movieId: 278, userId: otherUser.id, user_id: otherUser.id } });
 const firstSave = await resultOf('getSavedMovies', { cookie });
 assert.equal(firstSave.length, 1);
 assert.equal(firstSave[0].tmdb_movie_id, 278);
 assert.deepEqual(Object.keys(firstSave[0]).sort(), ['added_at', 'tmdb_movie_id'], 'No list entity, user ID or metadata leaks into SavedMovie model');
 assert.ok(!Number.isNaN(Date.parse(firstSave[0].added_at)), 'Save timestamp is present');
 await resultOf('addSavedMovie', { method: 'POST', cookie, data: { movieId: 278 } });
 assert.deepEqual(await resultOf('getSavedMovies', { cookie }), firstSave, 'Adding twice is idempotent and preserves original date');
 await resultOf('addSavedMovie', { method: 'POST', cookie, data: { movieId: 550 } });
 const invalidWrites = watchlistWrites;
 for (const movieId of [0, -1, 1.5, 2147483648, '278', null]) {
  await denied('addSavedMovie', { method: 'POST', cookie, data: { movieId } });
  await denied('removeSavedMovie', { method: 'POST', cookie, data: { movieId } });
 }
 await denied('addSavedMovie', { method: 'POST', cookie, data: {} });
 assert.equal(watchlistWrites, invalidWrites, 'Invalid movie IDs never write PostgreSQL');
 assert.deepEqual(await resultOf('getSavedMovies', { cookie: otherCookie }), [], 'Second account starts independently empty');
 await resultOf('addSavedMovie', { method: 'POST', cookie: otherCookie, data: { movieId: 278, userId: user.id } });
 assert.deepEqual((await resultOf('getSavedMovies', { cookie: otherCookie })).map(movie => movie.tmdb_movie_id), [278], 'Both accounts may save the same movie');
 assert.equal((await db.query('select count(*)::int as count from public.saved_movies where tmdb_movie_id=278')).rows[0].count, 2);
 const ownerBefore = await resultOf('getSavedMovies', { cookie });
 await resultOf('removeSavedMovie', { method: 'POST', cookie: otherCookie, data: { movieId: 550, userId: user.id, user_id: user.id } });
 assert.deepEqual(await resultOf('getSavedMovies', { cookie }), ownerBefore, 'Submitted foreign identity cannot remove another account movie');
 await db.transaction(async tx => {
  await tx.exec('set local role authenticated');
  await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [otherUser.id]);
  assert.equal((await tx.query('select * from public.saved_movies where user_id=$1', [user.id])).rows.length, 0, 'RLS hides foreign saved movies');
  assert.equal((await tx.query('delete from public.saved_movies where user_id=$1 returning *', [user.id])).rows.length, 0, 'RLS denies direct cross-owner removal');
 });
 await assert.rejects(db.transaction(async tx => {
  await tx.exec('set local role authenticated');
  await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [otherUser.id]);
  await tx.query('insert into public.saved_movies (user_id,tmdb_movie_id) values ($1,999)', [user.id]);
 }), error => error.code === '42501', 'RLS denies direct cross-owner insertion');
 assert.equal((await rpc('addSavedMovie', { method: 'POST', cookie, origin: 'https://other.example', data: { movieId: 999 } })).status, 403);
 assert.equal((await rpc('removeSavedMovie', { method: 'POST', cookie, origin: 'https://other.example', data: { movieId: 278 } })).status, 403);
 watchlistFailure = true;
 await denied('getSavedMovies', { cookie });
 await denied('addSavedMovie', { method: 'POST', cookie, data: { movieId: 999 } });
 await denied('removeSavedMovie', { method: 'POST', cookie, data: { movieId: 550 } });
 watchlistFailure = false;
 const newDeviceLogin = await rpc('signIn', { method: 'POST', data: { email: user.email, password: 'password123' } });
 const newDeviceCookie = cookieJar(newDeviceLogin);
 assert.deepEqual(await resultOf('getSavedMovies', { cookie: newDeviceCookie }), ownerBefore, 'Fresh session sees persisted saved movies');
 // Favorites share persistence/auth but never membership with Watchlist.
 await resultOf('addSavedMovie', { method: 'POST', cookie, data: { movieId: 278, category: 'favorites' } });
 const firstFavorite = await resultOf('getSavedMovies', { cookie, data: { category: 'favorites' } });
 await resultOf('addSavedMovie', { method: 'POST', cookie, data: { movieId: 278, category: 'favorites' } });
 assert.deepEqual(await resultOf('getSavedMovies', { cookie: newDeviceCookie, data: { category: 'favorites' } }), firstFavorite, 'Favorite is idempotent and persists in a fresh session');
 assert.deepEqual(await resultOf('getSavedMovies', { cookie }), ownerBefore, 'Adding favorite preserves Watchlist');
 assert.deepEqual(await resultOf('getSavedMovies', { cookie: otherCookie, data: { category: 'favorites' } }), [], 'Other account cannot see favorites');
 await resultOf('removeSavedMovie', { method: 'POST', cookie: otherCookie, data: { movieId: 278, category: 'favorites', userId: user.id } });
 assert.deepEqual(await resultOf('getSavedMovies', { cookie, data: { category: 'favorites' } }), firstFavorite, 'Foreign favorite removal is isolated');
 await resultOf('removeSavedMovie', { method: 'POST', cookie, data: { movieId: 278, category: 'favorites' } });
 assert.deepEqual(await resultOf('getSavedMovies', { cookie }), ownerBefore, 'Removing favorite preserves Watchlist');
 await resultOf('addSavedMovie', { method: 'POST', cookie, data: { movieId: 278, category: 'favorites' } });
 const restoredFavorite = await resultOf('getSavedMovies', { cookie, data: { category: 'favorites' } });
 const favoritePage = await fetch(`${base}/favorites`, { headers: { Cookie: newDeviceCookie } });
 assert.equal(favoritePage.status, 200);
 assert.ok((await favoritePage.text()).includes('My Favorites'), 'Favorites page renders after a fresh session');
 const writesBeforeInvalidCategories = watchlistWrites;
 for (const category of ['custom', '', null, 1, undefined]) {
  await denied('addSavedMovie', { method: 'POST', cookie, data: { movieId: 999, category } });
  await denied('removeSavedMovie', { method: 'POST', cookie, data: { movieId: 278, category } });
  await denied('getSavedMovies', { cookie, data: { category } });
 }
 assert.equal(watchlistWrites, writesBeforeInvalidCategories, 'Invalid categories never reach storage');
 const savedPage = await fetch(`${base}/watchlist`, { headers: { Cookie: newDeviceCookie } });
 assert.equal(savedPage.status, 200);
 const savedPageHtml = await savedPage.text();
 assert.ok(savedPageHtml.includes('My Watchlist'), 'Watchlist page uses simple singular heading');
 for (const obsoleteText of ['Create watchlist', 'Rename', 'Delete list', 'Delete watchlist', 'Choose a watchlist', 'New list', 'My Watchlists']) {
  assert.ok(!savedPageHtml.includes(obsoleteText), `Obsolete management interface removed: ${obsoleteText}`);
 }
 // All saved IDs must be returned even when a project caps each result below the
 // server batch size or has more than PostgREST's customary 1000-row maximum.
 await db.query('insert into public.saved_movies (user_id,tmdb_movie_id) select $1,id from generate_series(10000,11002) as id', [user.id]);
 const largePage = await fetch(`${base}/watchlist`, { headers: { Cookie: newDeviceCookie } });
 const largeHtml = await largePage.text();
 assert.equal(largePage.status, 200);
 assert.ok(largeHtml.includes('My Watchlist'), 'Large collection route still renders');
 assert.ok(!Array.from(summaryFetches.keys()).some(id => id >= 10024 && id <= 11002), 'First render does not fetch offscreen collection metadata');
 if (process.env.MOVIE_TEST_BROWSER === '1') {
  const { testCollectionBrowser } = await import('./fixtures/collection-browser.mjs');
  const expected = (await db.query("select tmdb_movie_id from public.saved_movies where user_id=$1 and category='watchlist' order by added_at desc,tmdb_movie_id asc limit 72", [user.id])).rows.map(row => row.tmdb_movie_id);
  await testCollectionBrowser(base, newDeviceCookie, expected);
 }
 const largeMovies = await resultOf('getSavedMovies', { cookie: newDeviceCookie });
 assert.equal(largeMovies.length, 1005, 'Pagination retrieves all saved movies past row caps');
 assert.equal(new Set(largeMovies.map(movie => movie.tmdb_movie_id)).size, 1005, 'No omitted or duplicate pagination boundaries');
 await db.query('delete from public.saved_movies where user_id=$1 and tmdb_movie_id between 10000 and 11002', [user.id]);
 await resultOf('removeSavedMovie', { method: 'POST', cookie: newDeviceCookie, data: { movieId: 278 } });
 await resultOf('removeSavedMovie', { method: 'POST', cookie: newDeviceCookie, data: { movieId: 278 } });
 assert.deepEqual((await resultOf('getSavedMovies', { cookie })).map(movie => movie.tmdb_movie_id), [550], 'Removal persists and is idempotent');
 assert.deepEqual((await resultOf('getSavedMovies', { cookie: otherCookie })).map(movie => movie.tmdb_movie_id), [278], 'Removing from one account leaves another account untouched');
 assert.deepEqual(await resultOf('getSavedMovies', { cookie: newDeviceCookie, data: { category: 'favorites' } }), restoredFavorite, 'Watchlist removal leaves Favorites intact');
 const refreshedWatchlist = await fetch(`${base}/watchlist`, { headers: { Cookie: cookie } });
 assert.equal(refreshedWatchlist.status, 200, 'Saved watchlist survives document refresh');
 const logout = await rpc('signOut', { method: 'POST', cookie });
 assert.equal(logout.status, 200); assert.match(logout.headers.get('set-cookie'), /Max-Age=0/i);
 assert.equal((await rpc('getAccount')).status, 401);
 assert.equal((await rpc('updateProfile', { method: 'POST', cookie, data: { displayName: 'After logout' } })).status, 401, 'Revoked sessions cannot update profiles');
 assert.equal((await rpc('getSavedMovies', { cookie })).status, 401, 'Revoked sessions cannot access saved movies');
 assert.equal((await rpc('addSavedMovie', { method: 'POST', cookie, data: { movieId: 999 } })).status, 401, 'Revoked sessions cannot save movies');
 // Email recovery operates without an existing session, but password updates do not.
 assert.equal((await fetch(`${base}/forgot-password`)).status, 200);
 const protectedReset = await fetch(`${base}/reset-password`, { redirect: 'manual' });
 assert.equal(protectedReset.status, 307);
 assert.equal(new URL(protectedReset.headers.get('location'), base).pathname, '/forgot-password');
 assert.equal((await rpc('resetPassword', { method: 'POST', data: { password: 'new-password123', confirmPassword: 'new-password123' } })).status, 401);
 const recoveryStart = await rpc('requestPasswordRecovery', { method: 'POST', data: { email: user.email } });
 assert.equal((await decode(recoveryStart)).result.error, null);
 assert.match(recoveryStart.headers.get('cache-control'), /no-store/);
 const recoveryCallback = new URL(latestRecoveryRedirect);
 assert.equal(recoveryCallback.origin, base);
 assert.equal(recoveryCallback.pathname, '/auth/confirm');
 assert.equal(recoveryCallback.searchParams.get('type'), 'recovery');
 const recoveryCookies = cookieJar(recoveryStart);
 assert.match(recoveryCookies, /code-verifier/, 'PKCE verifier is stored for same-browser recovery');
 assert.equal((await decode(await rpc('requestPasswordRecovery', { method: 'POST', data: { email: 'unknown@example.test' } }))).result.error, null, 'Unknown account has identical response');
 recoveryStatus = 400;
 assert.equal((await decode(await rpc('requestPasswordRecovery', { method: 'POST', data: { email: user.email } }))).result.error, null, 'Provider account errors do not disclose registration');
 recoveryStatus = 429;
 assert.match((await decode(await rpc('requestPasswordRecovery', { method: 'POST', data: { email: user.email } }))).result.error, /Too many requests/);
 recoveryStatus = 503;
 assert.match((await decode(await rpc('requestPasswordRecovery', { method: 'POST', data: { email: user.email } }))).result.error, /Unable to send/);
 recoveryStatus = 200;
 const requestsBeforeInvalid = recoveryRequests;
 await denied('requestPasswordRecovery', { method: 'POST', data: { email: 'not-an-email' } });
 assert.equal(recoveryRequests, requestsBeforeInvalid);
 assert.equal((await rpc('requestPasswordRecovery', { method: 'POST', origin: 'https://other.example', data: { email: user.email } })).status, 403);
 for (const suffix of ['token_hash=expired-token&type=recovery', 'code=invalid-code&type=recovery', 'error=access_denied&type=recovery', 'token_hash=valid-recovery-unused&code=valid-code&type=recovery']) {
  const response = await fetch(`${base}/auth/confirm?${suffix}`, { redirect: 'manual' });
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), '/forgot-password?error=recovery_failed');
 }
 const pkceRecovery = await fetch(`${base}/auth/confirm?code=valid-code&type=recovery&next=https://other.example`, { headers: { Cookie: recoveryCookies }, redirect: 'manual' });
 assert.equal(pkceRecovery.headers.get('location'), '/reset-password', 'PKCE recovery uses a fixed safe destination');
 const recoveryLink = `${base}/auth/confirm?token_hash=valid-recovery-once&type=recovery&next=https://other.example`;
 const verifiedRecovery = await fetch(recoveryLink, { redirect: 'manual' });
 assert.equal(verifiedRecovery.status, 303);
 assert.equal(verifiedRecovery.headers.get('location'), '/reset-password');
 assert.equal(verifiedRecovery.headers.get('referrer-policy'), 'no-referrer');
 const recoveredCookie = cookieJar(verifiedRecovery);
 assert.match(recoveredCookie, /auth-token/, 'Email link establishes a session without an old password');
 const reusedRecovery = await fetch(recoveryLink, { redirect: 'manual' });
 assert.equal(reusedRecovery.headers.get('location'), '/forgot-password?error=recovery_failed', 'Recovery link is single-use');
 const resetPage = await fetch(`${base}/reset-password`, { headers: { Cookie: recoveredCookie } });
 assert.equal(resetPage.status, 200);
 const resetHtml = await resetPage.text();
 assert.ok(resetHtml.includes('Set a new password') && resetHtml.includes('Confirm new password'));
 const writesBeforeInvalidPassword = passwordUpdates;
 for (const data of [{ password: 'short', confirmPassword: 'short' }, { password: 'new-password123', confirmPassword: 'different' }, { password: 'x'.repeat(129), confirmPassword: 'x'.repeat(129) }]) {
  await denied('resetPassword', { method: 'POST', cookie: recoveredCookie, data });
 }
 assert.equal(passwordUpdates, writesBeforeInvalidPassword, 'Invalid passwords never reach Supabase');
 assert.equal((await rpc('resetPassword', { method: 'POST', cookie: recoveredCookie, origin: 'https://other.example', data: { password: 'new-password123', confirmPassword: 'new-password123' } })).status, 403);
 passwordUpdateError = 'weak_password';
 assert.match((await resultOf('resetPassword', { method: 'POST', cookie: recoveredCookie, data: { password: 'new-password123', confirmPassword: 'new-password123' } })).error, /stronger password/);
 passwordUpdateError = 'same_password';
 assert.match((await resultOf('resetPassword', { method: 'POST', cookie: recoveredCookie, data: { password: 'new-password123', confirmPassword: 'new-password123' } })).error, /different/);
 passwordUpdateError = null;
 assert.equal((await resultOf('resetPassword', { method: 'POST', cookie: recoveredCookie, data: { password: 'new-password123', confirmPassword: 'new-password123', userId: otherUser.id } })).error, null);
 await rpc('signOut', { method: 'POST', cookie: recoveredCookie });
 assert.ok((await decode(await rpc('signIn', { method: 'POST', data: { email: user.email, password: 'password123' } }))).result.error, 'Previous password no longer signs in');
 const recoveredLogin = await rpc('signIn', { method: 'POST', data: { email: user.email, password: 'new-password123' } });
 assert.equal((await decode(recoveredLogin)).result.error, null, 'New password signs in');
 assert.deepEqual((await resultOf('getSavedMovies', { cookie: cookieJar(recoveredLogin) })).map(movie => movie.tmdb_movie_id), [550], 'Recovery preserves saved movies');
 assert.equal((await resultOf('getSavedMovies', { cookie: cookieJar(recoveredLogin), data: { category: 'favorites' } })).length, 1, 'Recovery preserves Favorites');
 console.log('PASS: Email recovery requests, enumeration-safe responses, rate limits, token/PKCE callbacks, expired/reused links, password validation, protected password updates, new-password login and collection preservation.');
 console.log('PASS: Home/previous-page auth redirects, account menu with display-name/email fallback, registration with/without confirmation, safe token/PKCE callbacks, login/logout, SSR refresh/renewal, editable profiles, independent Watchlist/Favorites, empty signup, duplicate handling, no management interfaces, input validation, account isolation, CSRF and protected operations (mock Auth + real local PostgreSQL).');
} finally {
 child.kill();
 await new Promise(resolve => mock.close(resolve));
 await db.close();
}
