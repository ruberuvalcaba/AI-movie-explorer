-- REVIEW AND APPROVE BEFORE APPLYING TO A HOSTED DATABASE.
-- This migration retires the old named-list tables after verifying their data.
-- Run during a coordinated application cutover: old application versions cannot
-- use their former tables after this transaction commits.
begin;
set local lock_timeout = '10s';

create table if not exists public.saved_movies (
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_movie_id integer not null,
  added_at timestamptz not null default now(),
  primary key (user_id, tmdb_movie_id),
  constraint saved_movies_positive_movie_id check (tmdb_movie_id > 0)
);
lock table public.saved_movies in access exclusive mode;

-- An already-existing target must have the expected shape and ownership key.
-- Refuse an incompatible partial/manual schema rather than retiring source data.
do $$
begin
  if (select count(*) from information_schema.columns
      where table_schema = 'public' and table_name = 'saved_movies') <> 3
    or not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'saved_movies' and column_name = 'user_id' and data_type = 'uuid' and is_nullable = 'NO')
    or not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'saved_movies' and column_name = 'tmdb_movie_id' and data_type = 'integer' and is_nullable = 'NO')
    or not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'saved_movies' and column_name = 'added_at' and data_type = 'timestamp with time zone' and is_nullable = 'NO')
    or not exists (
      select 1 from pg_constraint c
      where c.conrelid = 'public.saved_movies'::regclass and c.contype = 'p'
      and c.conkey = array[
        (select attnum from pg_attribute where attrelid = c.conrelid and attname = 'user_id'),
        (select attnum from pg_attribute where attrelid = c.conrelid and attname = 'tmdb_movie_id')
      ]::smallint[]
    )
    or not exists (
      select 1 from pg_constraint c
      where c.conrelid = 'public.saved_movies'::regclass and c.contype = 'f'
      and c.confrelid = 'auth.users'::regclass and c.confdeltype = 'c' and c.convalidated
      and c.conkey = array[(select attnum from pg_attribute where attrelid = c.conrelid and attname = 'user_id')]::smallint[]
      and c.confkey = array[(select attnum from pg_attribute where attrelid = c.confrelid and attname = 'id')]::smallint[]
    )
  then
    raise exception 'saved_movies is incompatible with the expected schema; source watchlists have not been retired';
  end if;
end;
$$;

alter table public.saved_movies alter column added_at set default now();
-- Enforce the positive-ID constraint even if the compatible target was created
-- manually with a differently named check. Constraint validation can abort safely.
alter table public.saved_movies drop constraint if exists saved_movies_positive_movie_id;
alter table public.saved_movies add constraint saved_movies_positive_movie_id check (tmdb_movie_id > 0);

-- One ordered index supports the actual owner-filtered, newest-first read; the
-- composite primary key already covers ownership and membership lookups.
create index if not exists saved_movies_user_added_idx
on public.saved_movies (user_id, added_at desc, tmdb_movie_id);

alter table public.saved_movies enable row level security;
-- Do not leave any pre-existing permissive policy on a compatible target.
do $$
declare policy_name text;
begin
  for policy_name in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'saved_movies'
  loop
    execute format('drop policy %I on public.saved_movies', policy_name);
  end loop;
end;
$$;
revoke all on public.saved_movies from public, anon, authenticated;
revoke all (user_id, tmdb_movie_id, added_at) on public.saved_movies from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, delete on public.saved_movies to authenticated;
grant insert (user_id, tmdb_movie_id) on public.saved_movies to authenticated;

create policy saved_movies_select_own on public.saved_movies for select to authenticated
using ((select auth.uid()) = user_id);
create policy saved_movies_insert_own on public.saved_movies for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy saved_movies_delete_own on public.saved_movies for delete to authenticated
using ((select auth.uid()) = user_id);

-- Lock both legacy tables before taking the source snapshot. Concurrent saves
-- cannot slip between the copy/verification and the final table retirement.
do $$
begin
  if (to_regclass('public.watchlists') is null) <> (to_regclass('public.watchlist_movies') is null) then
    raise exception 'Only one legacy watchlist table exists; repair the schema before migrating';
  end if;
  if to_regclass('public.watchlists') is not null then
    lock table public.watchlists, public.watchlist_movies in access exclusive mode;
    if exists (select 1 from public.watchlist_movies m left join public.watchlists w on w.id = m.watchlist_id where w.id is null) then
      raise exception 'Legacy movie rows lack a parent owner; refusing to retire source data';
    end if;

    insert into public.saved_movies (user_id, tmdb_movie_id, added_at)
    select w.user_id, m.tmdb_movie_id, coalesce(min(m.added_at), now())
    from public.watchlist_movies m join public.watchlists w on w.id = m.watchlist_id
    group by w.user_id, m.tmdb_movie_id
    on conflict (user_id, tmdb_movie_id) do update
      set added_at = least(public.saved_movies.added_at, excluded.added_at);

    -- Verify every distinct legacy owner/movie association and earliest save date
    -- against the target BEFORE dropping anything. Pre-existing earlier target
    -- dates are valid and remain unchanged.
    if exists (
      select 1 from (
        select w.user_id, m.tmdb_movie_id, coalesce(min(m.added_at), now()) as first_added_at
        from public.watchlist_movies m join public.watchlists w on w.id = m.watchlist_id
        group by w.user_id, m.tmdb_movie_id
      ) expected
      left join public.saved_movies s using (user_id, tmdb_movie_id)
      where s.user_id is null or s.added_at > expected.first_added_at
    ) then
      raise exception 'Saved-movie verification failed; source watchlists have not been retired';
    end if;

    -- RESTRICT protects unexpected external dependencies. Any failure rolls back
    -- the entire transaction, including copies and any already-executed DROP.
    drop table public.watchlist_movies restrict;
    drop table public.watchlists restrict;
  end if;
end;
$$;

commit;
