-- Apply before deploying the category-aware application. No rows are removed.
begin;
set local lock_timeout = '10s';
lock table public.saved_movies in access exclusive mode;

alter table public.saved_movies
  add column category text not null default 'watchlist'
  constraint saved_movies_category_check check (category in ('watchlist', 'favorites'));
alter table public.saved_movies drop constraint saved_movies_pkey;
alter table public.saved_movies add primary key (user_id, tmdb_movie_id, category);

drop index public.saved_movies_user_added_idx;
create index saved_movies_user_category_added_idx
  on public.saved_movies (user_id, category, added_at desc, tmdb_movie_id);

-- Existing SELECT/INSERT/DELETE policies use auth.uid() = user_id and apply
-- equally to both categories. UPDATE remains forbidden; timestamps stay server-owned.
grant insert (category) on public.saved_movies to authenticated;
commit;
