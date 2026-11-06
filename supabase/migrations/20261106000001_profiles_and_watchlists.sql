begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) <= 100),
  constraint profiles_avatar_url_length check (avatar_url is null or char_length(avatar_url) <= 2048)
);

create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint watchlists_name_valid check (char_length(btrim(name)) between 1 and 100)
);

create table public.watchlist_movies (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  tmdb_movie_id integer not null,
  added_at timestamptz not null default now(),
  constraint watchlist_movies_positive_tmdb_id check (tmdb_movie_id > 0),
  constraint watchlist_movies_unique_movie unique (watchlist_id, tmdb_movie_id)
);

-- Also support owner queries ordered by creation and movie queries ordered by addition.
create index watchlists_user_created_idx on public.watchlists(user_id, created_at desc, id);
create index watchlist_movies_list_added_idx on public.watchlist_movies(watchlist_id, added_at desc, id);
-- profiles.id and the unique movie constraint already supply the other FK/lookup indexes.

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger profiles_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger watchlists_updated_at before update on public.watchlists
for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.watchlists enable row level security;
alter table public.watchlist_movies enable row level security;

-- Explicit grants avoid depending on a project's default table privileges.
revoke all on public.profiles, public.watchlists, public.watchlist_movies from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, delete on public.profiles, public.watchlists, public.watchlist_movies to authenticated;
grant insert (id, display_name, avatar_url) on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;
grant insert (id, user_id, name) on public.watchlists to authenticated;
grant update (name) on public.watchlists to authenticated;
grant insert (id, watchlist_id, tmdb_movie_id) on public.watchlist_movies to authenticated;
grant update (watchlist_id, tmdb_movie_id) on public.watchlist_movies to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_delete_own on public.profiles for delete to authenticated
using ((select auth.uid()) = id);

create policy watchlists_select_own on public.watchlists for select to authenticated
using ((select auth.uid()) = user_id);
create policy watchlists_insert_own on public.watchlists for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy watchlists_update_own on public.watchlists for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy watchlists_delete_own on public.watchlists for delete to authenticated
using ((select auth.uid()) = user_id);

create policy watchlist_movies_select_own on public.watchlist_movies for select to authenticated
using (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = (select auth.uid())));
create policy watchlist_movies_insert_own on public.watchlist_movies for insert to authenticated
with check (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = (select auth.uid())));
create policy watchlist_movies_update_own on public.watchlist_movies for update to authenticated
using (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = (select auth.uid())))
with check (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = (select auth.uid())));
create policy watchlist_movies_delete_own on public.watchlist_movies for delete to authenticated
using (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = (select auth.uid())));

commit;
