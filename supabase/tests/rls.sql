-- Run only in a disposable database as its postgres/admin role.
-- Every fixture/helper is rolled back; failed assertions abort the test.
begin;

create function pg_temp.assert_true(ok boolean, label text) returns void
language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'FAIL: %', label; end if;
end;
$$;
create function pg_temp.expect_error(statement text, expected_state text, label text) returns void
language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_state then return; end if;
    raise exception 'FAIL: % (expected SQLSTATE %, got %: %)', label, expected_state, sqlstate, sqlerrm;
  end;
  raise exception 'FAIL: % (statement succeeded)', label;
end;
$$;

set local role supabase_auth_admin;
insert into auth.users (id, email, raw_user_meta_data) values
('a0000000-0000-4000-8000-000000000001', 'rls-a@example.test', '{"display_name":"  Alice  "}'),
('b0000000-0000-4000-8000-000000000002', 'rls-b@example.test', '{"display_name":{"unexpected":true}}'),
('c0000000-0000-4000-8000-000000000003', 'rls-c@example.test', null),
('d0000000-0000-4000-8000-000000000004', 'rls-d@example.test', jsonb_build_object('display_name', repeat('x', 200)));
reset role;

select pg_temp.assert_true((select display_name = 'Alice' from public.profiles where id = 'a0000000-0000-4000-8000-000000000001'), 'signup still creates normalized profile');
select pg_temp.assert_true((select display_name = '' from public.profiles where id = 'b0000000-0000-4000-8000-000000000002'), 'object metadata does not break signup');
select pg_temp.assert_true((select display_name = '' from public.profiles where id = 'c0000000-0000-4000-8000-000000000003'), 'null metadata does not break signup');
select pg_temp.assert_true((select length(display_name) = 100 from public.profiles where id = 'd0000000-0000-4000-8000-000000000004'), 'oversized metadata is safely truncated');
select pg_temp.assert_true((select count(*) = 0 from public.saved_movies where user_id in ('a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000002')), 'new users need no watchlist setup and have no sample movies');
select pg_temp.assert_true(to_regclass('public.watchlists') is null and to_regclass('public.watchlist_movies') is null, 'obsolete tables are retired');
select pg_temp.assert_true((select count(*) = 2 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('profiles','saved_movies') and c.relrowsecurity), 'both application tables enable RLS');
select pg_temp.assert_true((select count(*) = 4 from information_schema.columns where table_schema = 'public' and table_name = 'saved_movies'), 'saved movies store only owner, movie ID, category and timestamp');
select pg_temp.assert_true((select count(*) = 3 from pg_policies where schemaname = 'public' and tablename = 'saved_movies' and cmd in ('SELECT','INSERT','DELETE')), 'saved movies have only three ownership policies');
select pg_temp.assert_true((select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid = 'private.create_signup_profile()'::regprocedure), 'signup function remains hardened');
select pg_temp.assert_true(not has_function_privilege('authenticated', 'private.create_signup_profile()', 'execute'), 'signup function is not callable by users');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select pg_temp.assert_true((select count(*) = 1 from public.profiles), 'Alice sees only her profile');
update public.profiles set display_name = 'Alice Updated', avatar_url = 'https://example.test/avatar.png' where id = auth.uid();
select pg_temp.assert_true((select display_name = 'Alice Updated' and updated_at > created_at from public.profiles where id = auth.uid()), 'profile management and timestamp behavior are unchanged');
select pg_temp.expect_error($q$update public.profiles set id = 'b0000000-0000-4000-8000-000000000002' where id = auth.uid()$q$, '42501', 'cannot transfer profile identity');
update public.profiles set display_name = 'Stolen' where id = 'b0000000-0000-4000-8000-000000000002';
delete from public.profiles where id = 'b0000000-0000-4000-8000-000000000002';
select pg_temp.expect_error($q$insert into public.profiles (id) values ('b0000000-0000-4000-8000-000000000002')$q$, '42501', 'cannot insert another profile');
select pg_temp.expect_error($q$update public.profiles set display_name = repeat('x',101) where id = auth.uid()$q$, '23514', 'profile name length enforced');
select pg_temp.expect_error($q$update public.profiles set avatar_url = repeat('x',2049) where id = auth.uid()$q$, '23514', 'avatar length enforced');

select pg_temp.assert_true((select count(*) = 0 from public.saved_movies), 'new owner sees an empty implicit watchlist');
insert into public.saved_movies (user_id, tmdb_movie_id) values (auth.uid(), 278), (auth.uid(), 550);
select pg_temp.assert_true((select count(*) = 2 from public.saved_movies), 'owner can add and read movies');
select pg_temp.assert_true((select bool_and(added_at is not null) from public.saved_movies), 'database supplies added_at');
select pg_temp.expect_error($q$insert into public.saved_movies (user_id,tmdb_movie_id) values (auth.uid(),278)$q$, '23505', 'same user cannot save a movie twice');
insert into public.saved_movies (user_id,tmdb_movie_id,category) values (auth.uid(),278,'favorites');
select pg_temp.assert_true((select count(*) = 2 from public.saved_movies where tmdb_movie_id=278), 'same movie may belong to both categories');
select pg_temp.expect_error($q$insert into public.saved_movies (user_id,tmdb_movie_id,category) values (auth.uid(),278,'favorites')$q$, '23505', 'duplicate favorite rejected');
select pg_temp.expect_error($q$insert into public.saved_movies (user_id,tmdb_movie_id,category) values (auth.uid(),999,'custom')$q$, '23514', 'custom categories rejected');
select pg_temp.expect_error($q$insert into public.saved_movies (user_id,tmdb_movie_id,category) values (auth.uid(),999,null)$q$, '23502', 'null category rejected');
select pg_temp.expect_error($q$insert into public.saved_movies (user_id,tmdb_movie_id,category) values ('b0000000-0000-4000-8000-000000000002',278,'favorites')$q$, '42501', 'foreign favorite insertion rejected');
delete from public.saved_movies where tmdb_movie_id=278 and category='watchlist';
select pg_temp.assert_true((select count(*)=1 from public.saved_movies where tmdb_movie_id=278 and category='favorites'), 'watchlist removal preserves favorites');
insert into public.saved_movies (user_id,tmdb_movie_id) values (auth.uid(),278);
delete from public.saved_movies where tmdb_movie_id=278 and category='favorites';
select pg_temp.assert_true((select count(*)=1 from public.saved_movies where tmdb_movie_id=278 and category='watchlist'), 'favorite removal preserves watchlist');

select pg_temp.expect_error($q$insert into public.saved_movies (user_id,tmdb_movie_id) values ('b0000000-0000-4000-8000-000000000002',999)$q$, '42501', 'cannot save for another user');
select pg_temp.expect_error($q$insert into public.saved_movies (user_id,tmdb_movie_id) values (auth.uid(),0)$q$, '23514', 'zero TMDB ID rejected');
select pg_temp.expect_error($q$insert into public.saved_movies (user_id,tmdb_movie_id) values (auth.uid(),-1)$q$, '23514', 'negative TMDB ID rejected');
select pg_temp.expect_error($q$insert into public.saved_movies (user_id,tmdb_movie_id) values (auth.uid(),null)$q$, '23502', 'null TMDB ID rejected');
select pg_temp.expect_error($q$insert into public.saved_movies (user_id,tmdb_movie_id) values (null,999)$q$, '42501', 'RLS rejects a null owner');
select pg_temp.expect_error($q$insert into public.saved_movies (user_id,tmdb_movie_id,added_at) values (auth.uid(),999,'2000-01-01')$q$, '42501', 'clients cannot forge added_at');
select pg_temp.expect_error($q$update public.saved_movies set tmdb_movie_id = 999 where user_id = auth.uid()$q$, '42501', 'saved movie updates are not granted');
select pg_temp.expect_error($q$update public.saved_movies set user_id = 'b0000000-0000-4000-8000-000000000002' where user_id = auth.uid()$q$, '42501', 'ownership updates are not granted');
select pg_temp.expect_error($q$update public.saved_movies set added_at = now() where user_id = auth.uid()$q$, '42501', 'timestamp updates are not granted');

select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select pg_temp.assert_true((select count(*) = 0 from public.saved_movies), 'Bob cannot read Alice saved movies');
insert into public.saved_movies (user_id,tmdb_movie_id) values (auth.uid(),278);
insert into public.saved_movies (user_id,tmdb_movie_id,category) values (auth.uid(),550,'favorites');
select pg_temp.assert_true((select count(*) = 2 from public.saved_movies), 'different users can independently save the same TMDB ID');
delete from public.saved_movies where user_id = 'a0000000-0000-4000-8000-000000000001' and tmdb_movie_id = 278;
select pg_temp.expect_error($q$insert into public.saved_movies (user_id,tmdb_movie_id) values ('a0000000-0000-4000-8000-000000000001',999)$q$, '42501', 'Bob cannot insert into Alice watchlist');

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
select pg_temp.expect_error('select * from public.profiles', '42501', 'anonymous profile read denied');
select pg_temp.expect_error('select * from public.saved_movies', '42501', 'anonymous watchlist read denied');
select pg_temp.expect_error($q$insert into public.saved_movies (user_id,tmdb_movie_id) values ('a0000000-0000-4000-8000-000000000001',999)$q$, '42501', 'anonymous save denied');
select pg_temp.expect_error('delete from public.saved_movies', '42501', 'anonymous removal denied');
set local role authenticated;
select pg_temp.assert_true((select count(*) = 0 from public.profiles), 'authenticated role without subject sees no profiles');
select pg_temp.assert_true((select count(*) = 0 from public.saved_movies), 'authenticated role without subject sees no movies');
select pg_temp.expect_error($q$insert into public.saved_movies (user_id,tmdb_movie_id) values ('a0000000-0000-4000-8000-000000000001',999)$q$, '42501', 'missing-subject save denied');

reset role;
select pg_temp.assert_true((select display_name = '' from public.profiles where id = 'b0000000-0000-4000-8000-000000000002'), 'cross-owner profile writes did nothing');
select pg_temp.assert_true((select count(*) = 2 from public.saved_movies where user_id = 'a0000000-0000-4000-8000-000000000001'), 'cross-owner deletion did nothing');
select pg_temp.expect_error($q$insert into public.saved_movies (user_id,tmdb_movie_id) values ('f0000000-0000-4000-8000-000000000006',999)$q$, '23503', 'foreign key rejects nonexistent Auth user');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
delete from public.saved_movies where user_id = auth.uid() and tmdb_movie_id = 278;
select pg_temp.assert_true((select count(*) = 1 from public.saved_movies), 'owner can remove a movie');
delete from public.saved_movies where user_id = auth.uid() and tmdb_movie_id = 278;
select pg_temp.assert_true((select count(*) = 1 from public.saved_movies), 'removing an absent movie has no side effects');

reset role;
delete from auth.users where id = 'b0000000-0000-4000-8000-000000000002';
select pg_temp.assert_true((select count(*) = 0 from public.profiles where id = 'b0000000-0000-4000-8000-000000000002'), 'user deletion still cascades to profile');
select pg_temp.assert_true((select count(*) = 0 from public.saved_movies where user_id = 'b0000000-0000-4000-8000-000000000002'), 'user deletion cascades to saved movies');
rollback;
