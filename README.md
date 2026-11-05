# 🎬 AI Movie Explorer

A full-stack movie discovery application built with **React, TypeScript, and the TanStack ecosystem**, featuring an AI-powered assistant using **Google Gemini and the Model Context Protocol (MCP)**.

Think of it as a lightweight IMDb or Letterboxd experience combined with an intelligent movie assistant.

The project showcases modern frontend architecture, server-side rendering, efficient data fetching, performance optimization, and AI tool integration.

## ✨ Features

- **Movie Discovery:** Browse popular, trending, top-rated, and upcoming movies, with detailed information, ratings, and cast.
- **AI Movie Assistant:** Ask questions about movies and receive contextual recommendations powered by Gemini and MCP tools.
- **Structured AI Responses:** Display conversational responses alongside interactive movie cards.
- **Personal Watchlist:** Add and remove movies using Zustand-managed local state.
- **Infinite Scrolling:** Load paginated movie collections efficiently using TanStack Query.
- **Performance:** List virtualization, query caching, and route-based code splitting.
- **Responsive UI:** Built with Tailwind CSS, shadcn/ui, and Lucide icons.

## 🛠️ Tech Stack

| Category             | Technologies                                |
| -------------------- | ------------------------------------------- |
| Frontend             | React, TypeScript                           |
| Framework            | TanStack Start, Vite, Nitro                 |
| Routing & Data       | TanStack Router, TanStack Query             |
| State Management     | Zustand                                     |
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
- **Zustand** manages client-side watchlist state.
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
