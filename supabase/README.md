# Watchlist and Favorites update

Migration `20261109000001_saved_movie_categories.sql` extends `saved_movies` with
`category` (`watchlist` or `favorites`). Existing rows default to Watchlist without
changing ownership, movie IDs, or timestamps. The primary key is now
`(user_id, tmdb_movie_id, category)`, allowing independent membership in both
collections. No TMDB metadata or collection management records are stored.

The existing owner-only SELECT/INSERT/DELETE RLS policies cover both categories.
The migration grants INSERT on `category`; UPDATE and client-supplied timestamps
remain forbidden. The shared services always filter by both owner and category.
Server Functions validate category and movie IDs and resolve the user via Auth.
Query and mutation keys include user ID and category; mutations invalidate only
the corresponding collection. Logout/account changes clear both private caches.

Apply the category migration during a coordinated application cutover before
serving the new build. Pause old application writes during cutover: the old
application deletes by owner/movie only and does not understand Favorites.
Use normal migration tracking; do not replay previously applied migration files.
No hosted migration or deployment is performed by the local validation commands.
The historical migration03 below still requires approval if it is pending.

Local checks: `npm run test:db`, `npm run db:types`, `npx tsc --noEmit`,
`npm run build`, `npm run test:auth`, and `npm run test:cache`.
Tests cover category defaults, exact timestamp preservation, same-movie membership
in both categories, duplicates, independent removal, validation, RLS, separate
accounts, protected routes, fresh sessions, and cache cleanup. The HTTP suite uses
mock Auth/PostgREST endpoints backed by real local PostgreSQL. Real Supabase
sessions across browsers/devices still need a development-project smoke test.

The following notes describe the earlier Watchlist migration and its cutover.

# Profiles and implicit movie collections

The final application schema has `profiles` and `saved_movies`. Authentication and
profile creation/editing are unchanged. A user needs no default watchlist row:
their watchlist is simply their saved movies, which may be empty.

## Current schema and permissions

- `profiles` keeps the existing Auth user UUID, display name, optional avatar URL,
  timestamps, signup trigger, and owner policies.
- `saved_movies` contains only `user_id` (Auth user UUID), positive integer
  `tmdb_movie_id`, and `added_at`. `(user_id, tmdb_movie_id)` is the primary key,
  permitting different users to save the same movie without duplicates per user.
  User deletion cascades. An owner/date index supports the display order.
- Authenticated users may select/insert/delete only their own saved rows. Ownership
  comes from `auth.uid()` under RLS. There is no UPDATE grant or policy. Only owner
  and movie ID can be inserted by ordinary clients; the save date defaults on the
  server. Anonymous clients have no access. Ordinary requests use the existing
  publishable-key, user-authenticated, request-scoped client.

No movie titles, images, ratings, or other TMDB metadata are stored in the database.
The application exposes only get/add/remove saved movie Server Functions.

## Migration history

1. `20261106000001_profiles_and_watchlists.sql` is the original three-table schema.
2. `20261106000002_create_signup_profiles.sql` creates the signup profile trigger
   and backfills existing users.
3. `20261106000003_single_watchlist_saved_movies.sql` upgrades to the final schema.

Keep the original migration files unchanged, even though their tables are retired
by migration03. Fresh projects apply all three in filename order. Projects with
the first two applied need only03. Do not replay the original migrations over an
already migrated project or edit applied history.

Migration03 creates `saved_movies` if needed, locks the legacy and destination
tables for the transaction, derives ownership from `watchlists.user_id`, and
combines all existing list entries. For duplicate movies across a user's lists,
it preserves the earliest available `added_at`; an earlier date already in the
destination is also retained. It verifies that all legacy owner/movie associations
and their save dates are represented before dropping the two legacy tables.
Their attached policies/indexes/foreign keys are removed with those tables.
Unexpected dependencies cause the transaction to fail instead of being removed
with CASCADE. Incompatible existing target schemas or a partially missing legacy
schema cause failure, preserving the original data.

**Applying migration03 is a destructive schema change: list names and IDs are
retired. Saved movie associations are preserved, but restoring the multi-list
structure requires a backup. Do not apply it to any hosted/production database
without explicit approval.** Authoring/testing it does not deploy it.

## Local validation without a Supabase server

```sh
npm run test:db
npm run db:types
npx tsc --noEmit
npm run build
npm run test:auth
npm run test:cache
```

The development-only PGlite runner uses in-memory PostgreSQL with simulated
`auth.users`, `auth.uid()`, and Auth roles. It applies the actual SQL migrations
and tests populated legacy upgrades, deduplication/timestamps, transaction rollback,
profile continuity, final schema constraints, and RLS. It never reads `.env.local`
or connects to a remote database. `tests/rls.sql` is a plain SQL assertion suite
that raises on failure and rolls back its fixtures, rather than pgTAP.

The HTTP suite runs the built app with mocked Supabase Auth/PostgREST endpoints
and the real migrated local PostgreSQL schema/RLS. It exercises account isolation,
session restoration, profile editing, and saved movie operations. Cache tests use
the actual cleanup helper. They do not verify hosted Auth, email delivery, or an
actual browser/device.

## Full local Supabase verification

With Supabase CLI v3, a running local runtime, and PostgreSQL's `psql` client:

```sh
supabase start
supabase db reset
psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' -X -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
```

Reset is for a disposable **local** database only and discards that local data.
Never add a remote target to reset. Run the assertion suite only against disposable
local/development databases; it switches roles and rolls back fixtures. Unrestricted
admin SQL queries and service-role keys bypass RLS and cannot verify owner access.

For end-to-end RLS verification, register two development users and call the Data
API with each user's session and the publishable key. Verify each sees only their
rows, cannot insert another user's owner ID, and cannot delete the other's saved
movie. Both users should be able to save the same TMDB ID independently. A freshly
registered user has a profile and no saved movies, with no list setup required.

## Safe hosted cutover — approval required

These are review/application instructions only; no hosted commands were executed.

1. Confirm the intended project and migration history. If tables were created using
   SQL Editor, reconcile/baseline CLI history before pushing; do not blindly replay
   already applied files. Back up/export `profiles`, `watchlists`, and
   `watchlist_movies` (and any existing `saved_movies`). Keep names/IDs in the backup
   if a rollback to the previous application may be needed.
2. Review the pending SQL and run the local tests. Export the expected legacy
   owner/movie/date mapping before cutover:

   ```sql
   select w.user_id, m.tmdb_movie_id, min(m.added_at) as added_at
   from public.watchlists w
   join public.watchlist_movies m on m.watchlist_id = w.id
   group by w.user_id, m.tmdb_movie_id
   order by w.user_id, m.tmdb_movie_id;
   ```

3. With CLI v3, inspect the intended remote project and pending migrations:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase migration list --remote
   supabase db push --remote --dry-run
   ```

4. **Stop for explicit approval before applying.** Coordinate a maintenance/write
   pause and deployment of the single-watchlist build. The old build references
   tables dropped by03; this build requires `saved_movies`, so avoid serving
   mismatched application/schema versions during the cutover.
5. Only after approval, apply the reviewed pending migrations:

   ```sh
   supabase db push --remote
   ```

6. Verify final tables, RLS, migrated associations against the export, and earliest
   saved dates. Test real signup/confirmation, profile editing, add/remove, refresh,
   a fresh session/device, and a separate account. Restore the prior DB backup and
   matching prior application if rollback is needed; recreating empty legacy
   tables cannot restore list grouping/names.

If using SQL Editor on an approved development project instead, apply the pending
migration files in order and reconcile history before subsequently using CLI.
Never run `tests/rls.sql` fixtures on production.

## Database TypeScript types

`npm run db:types` generates `src/integrations/supabase/database.types.ts` from the
final migrated local PostgreSQL catalog, including `profiles` and `saved_movies`.
Both existing Supabase clients reuse those types. The generated row shapes do not
encode grants/RLS: a generated Update shape does not grant permission to UPDATE.

To compare with Supabase's official generator on a fully migrated local Supabase
stack (CLI v3 defaults to local):

```sh
supabase gen types typescript --schema public > /tmp/ai-movie-database.types.ts
```

Inspect the result before replacing the checked-in file. No remote type generation
is required. Future changes belong in new migration files.
