import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// In-memory PostgreSQL ONLY. Auth fixtures and failed migrations below never
// connect to a hosted Supabase project or read application environment variables.
const db = new PGlite();
const generatingTypes = process.argv.includes('--types');
const transitionName = '20261106000003_single_watchlist_saved_movies.sql';
let upgradeChecks = 0;
try {
 await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role supabase_auth_admin nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, supabase_auth_admin;
  grant insert on auth.users to supabase_auth_admin;
  grant execute on function auth.uid() to anon, authenticated;
 `);
 const migrations = (await readdir('supabase/migrations')).filter(name => name.endsWith('.sql')).sort();
 const scalar = async sql => Object.values((await db.query(sql)).rows[0])[0];
 async function expectRollback(sql, message) {
  try { await assert.rejects(() => db.exec(sql), error => error.message.includes(message)); }
  finally { await db.exec('rollback'); }
  assert.equal(await scalar('select count(*)::int from public.watchlist_movies'), 5, 'Failed transition preserves every source row');
  assert.equal(await scalar('select count(*)::int from public.watchlists'), 3, 'Failed transition preserves source lists');
  upgradeChecks++;
 }
 for (const name of migrations) {
  const sql = await readFile(`supabase/migrations/${name}`, 'utf8');
  if (name === transitionName) {
   // Overlapping memberships across lists and owners exercise ownership derivation,
   // union/deduplication, timestamp preservation, and existing destination rows.
   await db.exec(`
    insert into auth.users (id,email) values ('f0000000-0000-4000-8000-000000000005','second-existing@example.test');
    insert into public.watchlists (id,user_id,name) values
      ('e1000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000005','First'),
      ('e1000000-0000-4000-8000-000000000002','e0000000-0000-4000-8000-000000000005','Second'),
      ('f1000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000005','Other owner');
    insert into public.watchlist_movies (watchlist_id,tmdb_movie_id,added_at) values
      ('e1000000-0000-4000-8000-000000000001',278,'2022-01-03T00:00:00Z'),
      ('e1000000-0000-4000-8000-000000000002',278,'2021-01-03T00:00:00Z'),
      ('e1000000-0000-4000-8000-000000000001',550,'2023-02-04T00:00:00Z'),
      ('e1000000-0000-4000-8000-000000000002',550,'2025-02-04T00:00:00Z'),
      ('f1000000-0000-4000-8000-000000000001',278,'2024-03-05T00:00:00Z');
   `);
   const profilesBefore = (await db.query('select * from public.profiles order by id')).rows;
   if (!generatingTypes) {
    await db.exec('create view public.saved_movie_dependency_fixture as select id from public.watchlists');
    await expectRollback(sql, 'depend on it');
    assert.equal(await scalar("select to_regclass('public.saved_movies') is null"), true, 'New target creation rolls back on RESTRICT dependency failure');
    await db.exec('drop view public.saved_movie_dependency_fixture');
   }
   await db.exec(`
    create table public.saved_movies (
      user_id uuid not null references auth.users(id) on delete cascade,
      tmdb_movie_id integer not null check (tmdb_movie_id > 0),
      added_at timestamptz not null default now(),
      primary key(user_id,tmdb_movie_id)
    );
    insert into public.saved_movies(user_id,tmdb_movie_id,added_at) values
      ('e0000000-0000-4000-8000-000000000005',278,'2020-01-01T00:00:00Z'),
      ('e0000000-0000-4000-8000-000000000005',999,'2019-01-01T00:00:00Z');
    grant all on public.saved_movies to authenticated, anon;
    grant update(user_id),insert(added_at) on public.saved_movies to authenticated;
    create policy unsafe_existing_policy_fixture on public.saved_movies using (true) with check (true);
   `);
   if (!generatingTypes) {
    await db.exec('alter table public.watchlist_movies rename to watchlist_movies_missing_fixture');
    try { await assert.rejects(() => db.exec(sql), error => error.message.includes('Only one legacy watchlist table exists')); }
    finally { await db.exec('rollback'); }
    assert.equal(await scalar('select count(*)::int from public.watchlist_movies_missing_fixture'), 5, 'Incomplete legacy schema preserves source data');
    assert.equal(await scalar('select count(*)::int from public.watchlists'), 3, 'Incomplete legacy schema preserves source lists');
    await db.exec('alter table public.watchlist_movies_missing_fixture rename to watchlist_movies');
    upgradeChecks++;
    await db.exec('alter table public.saved_movies add column unexpected text');
    await expectRollback(sql, 'incompatible');
    await db.exec('alter table public.saved_movies drop column unexpected');
    await db.exec(`
     create function private.skip_movie_copy_fixture() returns trigger language plpgsql as $$ begin return null; end; $$;
     create trigger skip_movie_copy_fixture before insert or update on public.saved_movies for each row execute function private.skip_movie_copy_fixture();
    `);
    await expectRollback(sql, 'verification failed');
    assert.equal(await scalar('select count(*)::int from public.saved_movies'), 2, 'Failed copy verification preserves pre-existing target rows');
    await db.exec('drop trigger skip_movie_copy_fixture on public.saved_movies; drop function private.skip_movie_copy_fixture()');
   }
   await db.exec(sql);
   const saved = (await db.query("select user_id,tmdb_movie_id,to_char(added_at at time zone 'UTC','YYYY-MM-DD') as saved_date from public.saved_movies order by user_id,tmdb_movie_id")).rows;
   assert.deepEqual(saved, [
    { user_id: 'e0000000-0000-4000-8000-000000000005', tmdb_movie_id: 278, saved_date: '2020-01-01' },
    { user_id: 'e0000000-0000-4000-8000-000000000005', tmdb_movie_id: 550, saved_date: '2023-02-04' },
    { user_id: 'e0000000-0000-4000-8000-000000000005', tmdb_movie_id: 999, saved_date: '2019-01-01' },
    { user_id: 'f0000000-0000-4000-8000-000000000005', tmdb_movie_id: 278, saved_date: '2024-03-05' },
   ], 'Migration preserves the owner/movie union, earliest dates, and previous target entries');
   assert.equal(await scalar("select to_regclass('public.watchlists') is null and to_regclass('public.watchlist_movies') is null"), true, 'Verified legacy tables are retired');
   assert.deepEqual((await db.query('select * from public.profiles order by id')).rows, profilesBefore, 'Migration does not change profiles');
   upgradeChecks += 3;
   if (!generatingTypes) {
    await db.exec(sql);
    assert.deepEqual((await db.query("select user_id,tmdb_movie_id,to_char(added_at at time zone 'UTC','YYYY-MM-DD') as saved_date from public.saved_movies order by user_id,tmdb_movie_id")).rows, saved, 'Reapplying a completed transition does not lose data');
    upgradeChecks++;
   }
  } else {
   await db.exec(sql);
  }
  if (name === '20261106000001_profiles_and_watchlists.sql') {
   await db.exec(`insert into auth.users (id, email, raw_user_meta_data)
    values ('e0000000-0000-4000-8000-000000000005', 'existing@example.test', '{"display_name":"Existing"}');`);
  }
 }
 assert.equal((await db.query(`select display_name from public.profiles where id = 'e0000000-0000-4000-8000-000000000005'`)).rows[0]?.display_name, 'Existing', 'Existing Auth users remain backfilled');
 if (generatingTypes) {
  const { rows: columns } = await db.query(`select table_name, column_name, data_type, is_nullable, column_default
   from information_schema.columns where table_schema = 'public' and table_name in ('profiles','saved_movies') order by table_name, ordinal_position`);
  const { rows: relations } = await db.query(`select con.conname, c.relname as table_name, a.attname as column_name, r.relname as referenced_relation, ra.attname as referenced_column
   from pg_constraint con join pg_class c on c.oid=con.conrelid
   join pg_class r on r.oid=con.confrelid join pg_namespace rn on rn.oid=r.relnamespace
   join pg_attribute a on a.attrelid=c.oid and a.attnum=con.conkey[1]
   join pg_attribute ra on ra.attrelid=r.oid and ra.attnum=con.confkey[1]
   where con.contype='f' and rn.nspname='public' order by con.conname`);
  const typeMap = { uuid: 'string', text: 'string', 'timestamp with time zone': 'string', integer: 'number' };
  let output = '// Generated by npm run db:types from local migration introspection. Do not edit.\n';
  output += 'export type Database = { public: { Tables: {\n';
  for (const table of [...new Set(columns.map(col => col.table_name))]) {
   output += `${table}: {\n`;
   for (const shape of ['Row', 'Insert', 'Update']) {
    output += `${shape}: {\n`;
    for (const col of columns.filter(col => col.table_name === table)) {
     const type = typeMap[col.data_type];
     if (!type) throw new Error(`Unsupported PostgreSQL type: ${col.data_type}`);
     const optional = shape === 'Update' || (shape === 'Insert' && (col.column_default !== null || col.is_nullable === 'YES'));
     output += `${col.column_name}${optional ? '?' : ''}: ${type}${col.is_nullable === 'YES' ? ' | null' : ''};\n`;
    }
    output += '};\n';
   }
   output += 'Relationships: [\n';
   for (const rel of relations.filter(rel => rel.table_name === table)) {
    output += `{ foreignKeyName: "${rel.conname}"; columns: ["${rel.column_name}"]; isOneToOne: false; referencedRelation: "${rel.referenced_relation}"; referencedColumns: ["${rel.referenced_column}"]; },\n`;
   }
   output += '];\n};\n';
  }
  output += '}; Views: { [_ in never]: never }; Functions: { [_ in never]: never }; Enums: { [_ in never]: never }; CompositeTypes: { [_ in never]: never }; }; };\n';
  await writeFile('src/integrations/supabase/database.types.ts', output);
  console.log('Generated public database types from applied migrations.');
 } else {
  const tests = await readFile('supabase/tests/rls.sql', 'utf8');
  await db.exec(tests);
  console.log(`PASS: ${migrations.length} migrations, ${upgradeChecks} data-migration/rollback checks, existing-user backfill, and ${tests.match(/select pg_temp\.(assert_true|expect_error)\(/g).length} schema/RLS assertions (local PostgreSQL via PGlite).`);
  console.log('Supabase Auth schema is simulated locally. Also run rls.sql against a disposable Supabase database before deployment.');
 }
} catch (error) {
 console.error(error.message);
 process.exitCode = 1;
} finally { await db.close(); }
