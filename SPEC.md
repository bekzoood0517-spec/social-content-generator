# SPEC — Social Content Generator

Based on PRD.md. Describes architecture, data, API, prompts, and behavior.

## 1. Tech stack
| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | React + Vite + TypeScript | Fast, simple, typed |
| Styling | CSS Modules or plain CSS with design tokens | Full control over look (see DESIGN.md) |
| State | Zustand (or React context + reducer) | Small, simple |
| Storage | IndexedDB via `idb` (fallback localStorage) | History up to 200 entries |
| Backend | Node.js + Express (or Hono) | Thin proxy for Gemini |
| AI | Gemini API via `@google/genai`, model `gemini-2.5-flash` (configurable via env) | Fast, cheap, streaming support |
| Hosting | Vercel/Render/Cloud Run for backend; static hosting for frontend | Simple deploy |

> Verify the current Gemini model names and SDK usage in the official docs before implementation; they change often.

## 2. Architecture
```
Browser (React)
   │  POST /api/generate  (SSE stream)
   │  POST /api/suggest   (JSON)
   ▼
Backend proxy (Express)
   │  validation, rate limit, prompt assembly
   ▼
Gemini API (key in env GEMINI_API_KEY)
```
- The browser never sees the API key.
- Streaming from backend to browser via Server-Sent Events (SSE).
- History is stored only in the browser.

## 3. Project structure
```
/client
  /src
    /components   InputPanel, NetworkPicker, VariantCard, PostBlock, HistoryList, CopyButton, Toast
    /features     generate/, history/, suggest/
    /lib          api.ts, sse.ts, clipboard.ts, db.ts
    /styles       tokens.css, base.css
    App.tsx
/server
  index.ts
  routes/generate.ts, suggest.ts
  prompts/telegram.ts, instagram.ts, youtube.ts, common.ts
  lib/gemini.ts, validate.ts, rateLimit.ts
.env.example
```

## 4. Data models
```ts
type Network = 'telegram' | 'instagram' | 'youtube';
type Tone = 'neutral' | 'friendly' | 'expert' | 'bold';

interface GenerateRequest {
  input: string;            // 5..1000 chars
  network: Network;
  tone: Tone;
  language: string;          // ISO code, default 'en'
  variants: 1 | 2 | 3 | 4;
  angles?: string[];         // optional, from /suggest
}

interface Post {
  title: string;
  text: string;
  cta: string;
  hashtags: string[];        // without '#', UI adds it
}

interface Variant {
  id: string;
  index: number;
  angle?: string;
  status: 'pending' | 'streaming' | 'done' | 'error';
  post: Post;                // partial while streaming
  error?: string;
}

interface HistoryEntry {
  id: string;
  createdAt: number;
  network: Network;
  input: string;
  tone: Tone;
  language: string;
  variants: Post[];
  selectedIndex: number;     // variant shown in list
  // sync-ready fields (used in v2, harmless in v1)
  updatedAt: number;
  deleted?: boolean;         // soft delete (tombstone) so deletions can sync
  deviceId: string;          // random id generated once per browser
  schemaVersion: 1;
}
```

## 5. API

### POST `/api/suggest`
Pre-generation: returns angles.
- Request: `{ input, network, language }`
- Response: `{ angles: string[] }` (3 items, each ≤ 80 chars)
- Non-streaming, low token limit, timeout 5s.

### POST `/api/generate` (SSE)
- Request: `GenerateRequest`
- Backend starts N parallel Gemini streaming calls (one per variant), each with a different angle.
- SSE events:
  - `variant_start` `{ index }`
  - `delta` `{ index, field: 'title'|'text'|'cta'|'hashtags', chunk }`
  - `variant_done` `{ index, post }`
  - `variant_error` `{ index, code, message }`
  - `done` `{}`
- Client aborts via `AbortController`; the server cancels upstream calls on connection close.

### Errors
| Code | Meaning | UI behavior |
|------|---------|-------------|
| 400 | Invalid input | Inline field message |
| 429 | Rate limit | "Try again in N seconds" |
| 502 | Gemini failure | Retry button |
| 451/blocked | Safety block | "Try rephrasing" message |

## 6. Prompting
- System prompt per network (in `/prompts`), shared rules in `common.ts`.
- Output format: JSON with the `Post` schema using Gemini's structured output (`responseMimeType: application/json`, `responseSchema`).
- Streaming JSON strategy: stream raw JSON text, parse incrementally on the server with a tolerant partial-JSON parser to emit `delta` events by field. Fallback: if parsing fails, send a single `variant_done` at the end.
- Variants differ by `angle` (e.g., story, benefit, question, myth-busting) injected in the prompt; temperature 0.9–1.0.

### Network rules
| Network | Title | Text | CTA | Hashtags |
|---------|-------|------|-----|----------|
| Telegram | ≤ 80 chars, can include one emoji | 400–900 chars, short paragraphs | 1 sentence | 3–5 |
| Instagram | Hook ≤ 100 chars | 300–1,200 chars, line breaks, ≤ 3 emojis | 1 sentence | 8–15 |
| YouTube | ≤ 70 chars, keyword-first | Description 300–800 chars, with timestamps placeholder | 1 sentence (subscribe/comment) | 5–10 |

### Quality rules (common)
- Write in English by default. Use another language only when the user selects it in the language control.
- English is the primary tuning target: prompts, examples, and the banned-phrase list are written and tested in English first.
- No invented facts, prices, or claims beyond the input.
- Avoid stock AI phrases (maintain a banned list: "in today's fast-paced world", "unlock", "game-changer", "dive into", etc.).
- No more than the allowed emojis; no markdown headers.

## 7. Frontend behavior

### States
`idle → suggesting (optional) → generating → done | error`

### Streaming display
- Each field appends chunks to the variant's partial post.
- Text appears through a buffered typewriter: chunks go into a queue, rendered at an adaptive rate (about 40–80 chars/sec) so output looks smooth even when chunks arrive in bursts.
- A user can skip the animation ("show all").
- Reduced motion: text appears per field without typing.

### Pre-generation
- Debounce 800ms after the user stops typing (input ≥ 20 chars) → `/api/suggest`.
- Angles shown as small selectable chips; selected angles are passed to `/generate`.
- Idle pre-warm (optional setting, default off): after 2s idle with a valid form, start variant 1 silently; discard if input changes.

### Copy
- Whole-post format (plain text): 
  - Telegram/Instagram: `title\n\ntext\n\ncta\n\n#tag1 #tag2`
  - YouTube: `title\n\n` + `text\n\ncta\n\n#tag1 #tag2`
- Per-block copy buttons.
- Uses `navigator.clipboard.writeText`, fallback to `document.execCommand('copy')`.
- Feedback: button label/state change for ~1.5s plus an `aria-live` announcement.

### History
- Saved when a generation completes (at least one variant done).
- IndexedDB store `history`, key `id`, index on `createdAt`.
- List sorted by newest, grouped by day.
- Item actions: copy (one click, copies the selected variant), open, delete.
- Cap 200; oldest removed.
- Search: client-side substring on input and text.

## 8. Validation and limits
- Input trimmed, 5–1,000 characters.
- No daily or monthly usage limit.
- Anti-abuse only: short-window burst limiter (default 20 generations per IP per 10 minutes) and max 4 variants per request. The limiter returns 429 with a retry time and never blocks for a full day.
- Request timeout 30s per variant.
- Sanitize and strip control characters; limit hashtag length (≤ 30 chars) and count.
- Output validation: schema check, auto-retry once on invalid JSON.

## 9. Security and privacy
- `GEMINI_API_KEY` in server env only; `.env` ignored by git.
- CORS restricted to the app origin.
- v1: no server-side storage of inputs or outputs; logs exclude request bodies.
- v2: only synced history is stored server-side, only for signed-in users who opt in, with a delete-all-my-data action.
- Basic prompt-injection hardening: the user input is wrapped in delimiters and treated as data.

## 10. Accessibility
- All controls reachable by keyboard; visible focus ring.
- Network picker uses radio-group semantics.
- Streaming region `aria-live="polite"` updates only on completed fields, not every chunk.
- `prefers-reduced-motion` respected.
- Contrast ≥ 4.5:1 for text.

## 11. Testing
- Unit: prompt builders, partial-JSON parser, copy formatter, validators.
- Integration: `/generate` with a mocked Gemini stream, error paths.
- E2E (Playwright): generate → copy → history → re-copy.
- Manual: mobile Safari/Chrome clipboard behavior.

## 12. Environment variables
```
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
ALLOWED_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MIN=10
RATE_LIMIT_MAX=20
```

## 13. Implementation order
1. Server skeleton, `/api/generate` non-streaming for Telegram
2. Structured output + the other two networks
3. Parallel variants + SSE streaming
4. Client form, variant cards, typewriter buffer
5. Copy actions
6. History (IndexedDB)
7. `/api/suggest` and pre-generation
8. Editing, single-variant regenerate
9. Error states, rate limiting, accessibility pass
10. Tests, deploy
11. v2: sign-in, cloud store, sync engine (see section 15)

## 14. Acceptance criteria
- Choosing each network yields output matching its structure rules.
- With variants = 3, three cards stream in parallel; first text appears in < 2s typical.
- Copy puts correct plain text on the clipboard in one click, from both results and history.
- Reloading the page keeps history.
- No API key visible in browser network traffic or bundle.
- Works at 360px width and with reduced motion enabled.
- The interface text and default output are in English; switching the language control changes only the output language.
- After 50 consecutive generations from one browser (spaced beyond the burst window), no daily-limit message ever appears.
- Every history entry already contains `updatedAt`, `deviceId`, and `schemaVersion`.

## 15. v2: cross-device history sync (planned, not in v1)

### Approach
- **Local-first:** IndexedDB stays the primary store; the UI never waits on the network. Sync runs in the background.
- **Sign-in:** Google sign-in and/or email magic link (decision pending). Sync is opt-in.
- **Cloud store:** managed Postgres (or Firestore) with a `history_entries` table: `id`, `user_id`, `payload (JSON)`, `updated_at`, `deleted`, `device_id`, `schema_version`.
- **Sync API:**
  - `GET /api/sync?since=<timestamp>` returns entries changed after the timestamp (including tombstones)
  - `POST /api/sync` accepts a batch of local changes
- **Conflict resolution:** last-write-wins by `updatedAt`; deletions are soft (tombstones) and purged after 30 days.
- **First sign-in:** merge local history with cloud history by `id`, then upload the remainder.
- **Limits:** keep the same 200-entry cap per device view; cloud retention to be decided.
- **Privacy:** encrypted in transit and at rest; "delete all my data" endpoint; no use of history for anything but showing it back to the user.

### Why v1 prepares for it
The extra fields on `HistoryEntry` (`updatedAt`, `deleted`, `deviceId`, `schemaVersion`) mean v2 needs no data migration.
