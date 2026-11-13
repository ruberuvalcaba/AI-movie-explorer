import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
const originalFetch = globalThis.fetch;
const originalKey = process.env.MDBLIST_API_KEY;
let sequence = 0;
async function loader() { return (await import(`../../src/features/movies/services/mdblist.server.ts?test=${sequence++}`)).getExternalMovieRatings; }
afterEach(() => {
 globalThis.fetch = originalFetch;
 if (originalKey === undefined) delete process.env.MDBLIST_API_KEY;
 else process.env.MDBLIST_API_KEY = originalKey;
});

test('missing key never requests MDBList', async () => {
 delete process.env.MDBLIST_API_KEY;
 globalThis.fetch = async () => { throw new Error('Must not fetch'); };
 assert.deepEqual(await (await loader())(157336), {status:'unavailable',reason:'not-configured',retryAt:null});
});

test('uses the TMDB ID once and returns normalized ratings only', async () => {
 process.env.MDBLIST_API_KEY = 'unit-secret';
 let calls = 0;
 globalThis.fetch = async input => {
  calls++;
  const url = new URL(input);
  assert.equal(url.origin,'https://api.mdblist.com');
  assert.equal(url.pathname,'/tmdb/movie/157336/');
  assert.equal(url.searchParams.get('apikey'),'unit-secret');
  return Response.json({title:'Ignored',ratings:[{source:'imdb',value:8.2,score:82}]});
 };
 const result = await (await loader())(157336);
 assert.equal(calls,1);
 assert.equal(result.status,'available');
 assert.deepEqual(result.ratings.imdb,{score:8.2,voteCount:null});
 assert.ok(!JSON.stringify(result).includes('unit-secret'));
 assert.ok(!JSON.stringify(result).includes('Ignored'));
});

test('missing data and absent titles are distinct from temporary or authentication failures', async () => {
 process.env.MDBLIST_API_KEY = 'unit-secret';
 for(const [status,body,expected] of [[200,{},'missing'],[200,{ratings:[]},'missing'],[404,{},'missing'],[401,{},'unauthorized'],[403,{},'unauthorized'],[422,{},'invalid-id'],[503,{},'upstream'],[200,{ratings:'invalid'},'invalid-response'],[200,{error:'unit-secret'},'invalid-response']]) {
  globalThis.fetch=async()=>Response.json(body,{status});
  const result = await (await loader())(157336);
  assert.equal(result.status==='unavailable'?result.reason:result.status,expected);
  assert.ok(!JSON.stringify(result).includes('unit-secret'));
 }
});

test('network and JSON failures never disclose request URLs or credentials', async () => {
 process.env.MDBLIST_API_KEY='unit-secret';
 globalThis.fetch=async()=>{throw new Error('https://api.mdblist.com?apikey=unit-secret');};
 assert.deepEqual(await (await loader())(157336),{status:'unavailable',reason:'network',retryAt:null});
 globalThis.fetch=async()=>new Response('not JSON');
 assert.equal((await (await loader())(157336)).reason,'invalid-response');
});

test('429 honors Retry-After across movies and allows a later request after expiry', async t => {
 process.env.MDBLIST_API_KEY='unit-secret';
 t.mock.timers.enable({apis:['Date'],now:100000});
 let calls=0;
 globalThis.fetch=async()=>{calls++;return calls===1?new Response('',{status:429,headers:{'Retry-After':'120'}}):Response.json({ratings:[]});};
 const getRatings=await loader();
 assert.deepEqual(await getRatings(157336),{status:'unavailable',reason:'rate-limited',retryAt:220000});
 assert.equal((await getRatings(278)).reason,'rate-limited');
 assert.equal(calls,1);
 t.mock.timers.tick(120001);
 assert.equal((await getRatings(278)).status,'missing');
 assert.equal(calls,2);
});
