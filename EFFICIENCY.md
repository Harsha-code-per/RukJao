# Efficiency

## Server

- **Engine first, AI second.** The rule engine is pure regex and a URL parser, running in about a millisecond. The AI is called once per *unique* request.
- **LRU cache** (`server/cache.ts`, 500 entries) keyed by the SHA-256 of the request. Repeats are free and are not counted twice in Firestore. A fallback answer is not cached while AI is configured, so the next try can still reach the model.
- **AI budget:** low temperature, structured JSON output, a 10-second timeout per model (the minimum Gemini accepts), and a short model chain that stops at the first valid answer.
- **Firestore:** one document per scam family per week, updated with an atomic `increment`. That is two operations per new check, with no queries or scans.
- **Compression** on every response (`hono/compress`).
- **Cloud Run:** scales to zero, `--cpu-throttling` (CPU only while handling requests), max 1 instance, 512 MiB.

## Client

- **Code-split:** the checker (with zod) loads only when you open it. The landing page ships React and the page alone.
- **Hashed assets** are served with `Cache-Control: public, max-age=31536000, immutable`.
- **Fonts:**
  - one variable family, self-hosted, `font-display: swap`
  - the Latin cut keeps the width axis (114 KB)
  - Devanagari uses the lighter weight-only cut (258 KB instead of 726 KB)
  - `unicode-range` makes the browser download a script's font only when that script appears on the page
- **No animation library:** the hero is CSS keyframes paused by one timer. The stamp's ink texture is a single SVG filter.
- **No runtime dependencies** for routing, state or styling: the History API, `useState` and plain CSS.

## Build and deploy

- A multi-stage Docker image runs `npm prune --omit=dev` and ships only `dist/`, `dist-server/` and production modules.
- An Artifact Registry cleanup policy keeps the latest two images.
