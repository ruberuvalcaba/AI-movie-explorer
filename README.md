# 🎬 AI Movie Explorer

A full-stack movie discovery application built with **React, TypeScript, and the TanStack ecosystem**, featuring an AI-powered assistant using **Google Gemini and the Model Context Protocol (MCP)**.

Think of it as a lightweight IMDb or Letterboxd experience combined with an intelligent movie assistant.

The project showcases modern frontend architecture, server-side rendering, efficient data fetching, performance optimization, and AI tool integration.

## ✨ Features

- **Movie Discovery:** Browse popular, trending, top-rated, and upcoming movies, with detailed information, ratings, and cast.
- **AI Movie Assistant:** Ask questions about movies and receive contextual recommendations powered by Gemini and MCP tools.
- **Voice Input:** Record English or Spanish speech, review the transcript, and send it through the existing assistant.
- **Structured AI Responses:** Display conversational responses alongside interactive movie cards.
- **Personal Watchlist:** Save or remove movies with one bookmark action; your saved movies follow your Supabase account across devices.
- **Infinite Scrolling:** Load paginated movie collections efficiently using TanStack Query.
- **Performance:** List virtualization, query caching, and route-based code splitting.
- **Responsive UI:** Built with Tailwind CSS, shadcn/ui, and Lucide icons.

## 🛠️ Tech Stack

| Category             | Technologies                                |
| -------------------- | ------------------------------------------- |
| Frontend             | React, TypeScript                           |
| Framework            | TanStack Start, Vite, Nitro                 |
| Routing & Data       | TanStack Router, TanStack Query             |
| UI State             | React state                                 |
| Performance          | TanStack Virtual, React Compiler            |
| AI                   | TanStack AI, Google Gemini, MCP SDK         |
| Validation           | Zod                                         |
| UI                   | Tailwind CSS, shadcn/ui, Lucide, Streamdown |
| API                  | TMDB                                        |
| Tooling & Deployment | Biome, Vercel                               |

## 🏗️ Architecture

The application follows a **feature-based architecture**, separating UI components, data fetching, server-side business logic, and external integrations.

### Movie Discovery

```text
React Components
       │
       ▼
TanStack Query
       │
       ▼
TanStack Start Server Functions
       │
       ▼
Server-side Movie Services
       │
       ▼
TMDB API
```

- **TanStack Query** handles caching, pagination, and asynchronous server state.
- **TanStack Start Server Functions** provide validated access to server-side operations.
- **Supabase PostgreSQL + RLS** persist saved TMDB movie IDs directly per user; user-scoped TanStack Query caches server data.
- **React state** holds temporary editing forms.
- **Server-only services** centralize TMDB integration and protect API credentials.

### AI Assistant & MCP

```text
React UI (TanStack AI)
          │
          ▼
      POST /ai
          │
          ▼
    Google Gemini
          │
          ▼
      MCP Client
          │
    Authenticated HTTP
          │
          ▼
   MCP Server (/mcp)
          │
          ▼
    Movie Services
          │
          ▼
       TMDB API
          │
          ▼
    MCP Tool Results
          │
          ▼
  Gemini Structured Output
          │
          ▼
   Response Enrichment
          │
          ▼
    SSE → React UI
    Message + Movie Cards
```

The assistant uses an **MCP-first architecture**, allowing Gemini to retrieve movie information through three tools:

- `search_movies` — Search movies by title.
- `get_movie` — Retrieve movie details.
- `get_movie_recommendations` — Find related movies.

Responses are validated with **Zod** and enriched with TMDB movie data before rendering. This separates AI-generated recommendations from application-controlled movie metadata.

Communication between the AI route and MCP server uses authenticated HTTP, while Gemini and TMDB credentials remain server-side.

### Voice Input

Tap the microphone in the assistant, allow microphone access, then tap Stop to transcribe. The text is appended to the draft for review; it is never sent to chat automatically. Cancel discards the recording or ignores a pending transcription. Recordings stop after one minute and are limited to 2 MiB.

Microphone recording requires HTTPS or localhost and a browser with MediaRecorder support. The server sends audio to Gemini using the existing `GOOGLE_API_KEY` or `GEMINI_API_KEY`. Optionally set the server-only `GEMINI_TRANSCRIPTION_MODEL` to an audio-capable Gemini model; the default is `gemini-3.5-flash-lite`. Transcription uses the provider API and may incur usage charges. The application does not persist audio.

Run the mocked transcription tests with Node 24:

```sh
node --test src/features/assistant/services/transcription.server.test.mjs
```

## ⚡ Performance

Key optimizations include:

- **TanStack Query:** Caching, stale-time configuration, and infinite pagination.
- **TanStack Virtual:** Reduced DOM overhead for large movie collections.
- **TanStack Router:** Route-based code splitting.
- **React Compiler:** Build-time React rendering optimizations.
- **TanStack Start:** Server-side rendering and server functions.

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- [TMDB API access token](https://developer.themoviedb.org/)
- [Google Gemini API key](https://ai.google.dev/)

### Installation

```bash
npm install
```

Create a `.env` file:

```env
TMDB_ACCESS_TOKEN=your_tmdb_access_token
GEMINI_API_KEY=your_gemini_api_key
MCP_TOKEN=your_secure_mcp_token
MCP_URL=http://localhost:3000/mcp
```

Update `MCP_URL` if your local development server uses a different port.

Start the application:

```bash
npm run dev
```

### Build & Validation

```bash
npm run build
npx tsc --noEmit
npm run check
```

**Security:** Keep `.env` out of version control. API credentials must remain server-side and should not use the `VITE_` prefix.

## ☁️ Deployment

The application is deployed on **Vercel**, using TanStack Start and Nitro for server-side execution.

Production environment variables:

- `TMDB_ACCESS_TOKEN`
- `GEMINI_API_KEY`
- `MCP_TOKEN`
- `MCP_URL`

Set `MCP_URL` to your publicly accessible production endpoint:

```env
MCP_URL=https://your-app.vercel.app/mcp
```

Pushing changes to the connected production branch automatically triggers a new Vercel deployment when Git integration is enabled.

---

Built to explore **modern React architecture, AI-powered applications, MCP tool integration, and production-ready frontend engineering**.

Movie data provided by [TMDB](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB.

## Supabase authentication

Authentication uses `@supabase/ssr` cookie sessions, a reusable browser client,
and a fresh server client per request. The server verifies users with `getUser()`;
only verified ID/email and the profile display name are exposed to router context.
The header shows the display name, falling back to email when no name is available.
Movie browsing remains public. `/profile`, `/watchlist`, account reads, and
watchlist operations require a verified session. Each account has one implicit,
unnamed watchlist represented by its `saved_movies` rows. New accounts start empty,
without creating a list record. No former Zustand/demo data is imported.
Login/logout use document navigation to discard account-specific client state.
Other tabs and focus changes invalidate authentication context. The header sign-in
link remembers the current in-app URL, including search and hash, and returns
there after login; direct login without a return URL goes to Home.
The profile page loads `public.profiles` and lets the authenticated user edit their
display name (1–100 characters after trimming). Profile reads and updates verify
identity with `getUser()` and constrain the row by that verified ID, with database
RLS as an additional check.

### Supabase configuration

1. Create a Supabase project and enable the Email provider under Authentication.
2. Add these variables to `.env.local` and Vercel (including the deployment
   environments you use), then restart development or rebuild/redeploy:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```

   These two values are public project identifiers used by the browser. Never
   use a secret/service-role key. Existing TMDB/Gemini/MCP secrets stay server-only.
3. Set Authentication → URL Configuration → Site URL to your production origin.
   For a local test project, use `http://localhost:3000`. Configure approved
   production/local redirect URLs. Include your `/auth/confirm` callback with its
   `next` query string (for example, an origin-specific allowlist pattern such as
   `https://YOUR_DOMAIN/auth/confirm**` and `http://localhost:3000/auth/confirm**`).
   Prefer a separate project for development.
4. Keep Confirm email enabled. In Authentication → Email Templates → Confirm
   signup, replace the confirmation link with:

   ```html
   <a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}">Confirm email</a>
   ```

   Signup supplies `RedirectTo` as the current app origin's `/auth/confirm?next=...`.
   The server verifies the one-time token, writes session cookies, and returns to
   the sanitized in-app destination (default Home, `/`). The callback also accepts
   a PKCE `code` when the browser has its verifier cookie. It rejects external or
   encoded external return URLs. Invalid/expired links return to the login screen
   with a useful error. If confirmation is disabled, signup signs in immediately.
   The UI requires at least eight password characters; configure the project's
   password policy accordingly. The former `SiteURL` template still confirms
   email but falls back to Home instead of preserving the destination.
5. Configure production SMTP and Auth rate limits in Supabase before launch.

Registration/login remain available independently of profile reads. Editable
profiles use the original profile/Auth migrations, including the signup trigger
and existing-user backfill. The single-watchlist application additionally requires
migration `20261106000003_single_watchlist_saved_movies.sql`; see
[database setup](supabase/README.md). No migration is applied to your hosted project
by the application. Until the profile migrations are applied,
profile loading shows an unavailable message and disables editing. No service-role
key is needed. Profile creation is handled by the database trigger, not by a
privileged browser or API request.

Cookies use SameSite=Lax, Path=/, and Secure in production. Supabase's standard
browser/SSR flow requires JavaScript-readable cookies so the browser SDK can
refresh sessions; they are not HttpOnly. Authenticated responses and cookie writes
use private/no-store caching headers, compatible with Vercel. Do not override
these responses with shared CDN caching rules.

### Authentication validation

```sh
npx tsc --noEmit
npm run build
npm run test:auth
```

The HTTP smoke test launches the built production app and a **mock** Supabase Auth
server and a mock PostgREST adapter backed by real local PGlite PostgreSQL using
our migrations and RLS. It checks signup/profile creation, login, confirmation
callbacks and safe redirects, SSR session restoration/renewal, profile updates and
validation, cross-user isolation, anonymous rejection, and CSRF. It creates no
hosted accounts, does not render a browser UI, and does not verify real email delivery.
Run it after building; local listening ports are required.

To verify the configured Supabase project manually:

- Register, follow the confirmation email, and verify your display name in the header (or email until you set a name).
- Sign out, then sign in with email/password; refresh `/profile` and navigate between pages.
- Edit your display name, save, and refresh: the saved name must remain. Verify blank
  or oversized names are rejected and a second account cannot read/update your profile.
- Test `/login?redirect=/` and registration with a return destination; login and
  confirmation should return there. External destinations must fall back to Home (`/`).
- Open `/profile` and `/watchlist` in an anonymous window: both must redirect to login.
- Sign out and verify account data disappears; try an expired/invalid confirmation link.
- Verify sign-out in another tab updates the header when the original tab regains focus.

Without Supabase variables, public browsing remains available and auth forms show
that authentication is not configured. Live login/email checks require those values.

### Single watchlist per user

Each authenticated user has one implicit watchlist. Movie cards (including mini
cards) have a bookmark button showing whether a movie is saved; the movie details
page uses the same control. Visitors receive a sign-in link returning to that
movie. **My Watchlist** displays the saved movies using existing MovieCards, with
loading, empty, error/retry, and unavailable-movie states. Unavailable movies can
still be removed. There are no list selectors, names, creation, renaming, or
list-deletion controls. The header badge counts saved movies.

The only persisted watchlist table is `saved_movies(user_id, tmdb_movie_id, added_at)`.
Its primary key prevents duplicates per user. RLS allows authenticated owners to
select, insert, and delete their own rows; updates are not granted. Movie metadata
continues to come from existing TMDB services. No default list or sample movies
are created for new accounts.

Three protected Server Functions provide `getSavedMovies`, `addMovieToWatchlist`,
and `removeMovieFromWatchlist`. User identity always comes from the verified
server session; movie mutations accept only a validated positive integer movie ID.
Adds/removals are idempotent, and saved IDs are read in pages so API row limits do
not silently truncate large collections.

TanStack Query uses `["private", userId, "savedMovies"]` for persisted data. Cards,
movie details, the header, and the watchlist page share that cache. Successful
mutations invalidate that user's query; private queries/mutations are cleared on
logout/account switches and old reads are cancelled. The existing cleanup keeps
public TMDB queries intact. Zustand does not duplicate persisted watchlist state.

**Migration03 must be reviewed and explicitly approved before applying it to a
hosted database.** It merges existing list entries by owner/movie, keeps the
earliest save date, verifies every association, then drops the obsolete list
and membership tables inside the same transaction. List names/IDs are retired;
back up the legacy tables if they are needed for rollback. Original migrations
remain unchanged for reproducibility. Coordinate application/database cutover;
the old multi-list build and this build require different final schemas. No
production deployment or remote database change is performed automatically.
See the [migration and permission guide](supabase/README.md).

After a production build, run:

```sh
npm run test:auth
npm run test:cache
npm run test:db
```

The HTTP suite uses mocked Auth/PostgREST endpoints with actual local PostgreSQL
migrations and RLS. It tests empty signup, add/remove, duplicates, saved dates,
fresh-session persistence, account isolation, input validation, pagination, and
revoked sessions. Database tests additionally verify legacy-data migration,
deduplication, failure rollback, and final permissions. Cache tests check account
switching, cancellation, logout, and late responses. These tests do not verify
hosted configuration, real email delivery, or a physical second device.

For hosted acceptance after approval and migration, register a new account and
verify an empty watchlist. Save a movie from a card, open its details and verify
the saved status, refresh, and sign into the same account in another browser or
device. Confirm a different account starts empty and can save the same movie
independently. Remove a movie, refresh, and sign out to verify private saved data
is gone. Movie discovery and the AI assistant keep using their existing services.

### Email password recovery

Login includes **Forgot password?** at `/forgot-password`. Users request an email,
follow its link to `/auth/confirm`, and set a new password at `/reset-password`.
Recovery requests use a generic response regardless of whether an account exists.
Password updates require a verified Auth session and matching passwords of 8–128
characters; Supabase also enforces its configured password policy. No movie data
or database migrations are involved.

For a hosted Supabase project, configure these settings before testing delivery:

1. Set **Authentication → URL Configuration → Site URL** to the deployed app's
   trusted origin. Allow the app's `/auth/confirm` callback in Redirect URLs (and
   the localhost callback for development).
2. In **Email Templates → Reset Password**, use the contents of
   `supabase/templates/recovery.html`. Its token-hash link works when the email is
   opened in another browser/device; it does not rely on a browser's PKCE cookie.
   The callback also supports PKCE recovery codes for default-template flows,
   which require the browser that requested the email.
3. Configure production SMTP/email delivery and appropriate Supabase Auth rate
   limits. The app uses Supabase's email rate limiting; it does not send mail itself.
4. Test requesting a real email, completing recovery, signing in with the new
   password, and expired/reused links. Requests have no effect on the existing
   password until a new password is submitted successfully.

Local Supabase uses the checked-in recovery template/configuration. Hosted
settings are not updated by editing these files. `npm run test:auth` tests recovery
with mock Auth endpoints; it does not send email or verify hosted deliverability.

### Large Watchlist / Favorites performance

Collection pages show 24 movies initially, with **Load more movies** revealing
another 24. Counts and save controls still use the complete membership list.
Only revealed cards request metadata, using lightweight summaries without trailers.
Full details and trailers retain their separate query/cache. Previously loaded
full details can seed a summary, never the reverse.

TanStack Query treats cached summaries as fresh for ten minutes and reuses them
across Watchlist and Favorites. There is no custom server cache, request queue, or collection grid
virtualization. The loaded portion is remembered in a user/category-specific
private query entry when returning from movie details; account cleanup clears it.
No database schema or hosted configuration changes are required.

Validation: `npm run test:auth`, `npm run test:cache`, `npm run test:search`,
`npm run test:db`, `npx tsc --noEmit`, and `npm run build`.
For browser layout tests, use `MOVIE_TEST_BROWSER=1 npm run test:auth`.
This starts headless Chrome with a temporary profile and local mocked services;
set `CHROME_PATH` if Chrome is not installed at the default macOS location.
The browser test checks the first 24 cards, Load more, mobile row spacing,
responsive column counts, and the last loaded row.
