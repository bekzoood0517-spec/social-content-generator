# The Editor's Desk — Social Content Generator

A social content generator web application built on **React + Vite + TypeScript** and **Node.js + Express** with **Gemini API** streaming. Designed with a calm, tactile "editor's desk" aesthetic (warm paper, serif typography, rubber approval stamp, and ledger history) with zero generic AI look.

---

## Features

- **Platform-tuned generation**:
  - **Telegram (`TG`)**: Headlines ≤80 chars, concise scannable paragraphs, 1-sentence CTA, 3–5 clean hashtags.
  - **Instagram (`IG`)**: Hook ≤100 chars, rhythmic line-broken body, ≤3 emojis, 8–15 targeted hashtags.
  - **YouTube (`YT`)**: Keyword-first title ≤70 chars, description with timestamp placeholders (`00:00 Intro...`), 1-sentence CTA, 5–10 tags.
- **Pre-generation suggestions**: Debounces typing (≥20 chars) to suggest 3 editorial angles that can be toggled as chips.
- **SSE Parallel Streaming**: Streams title, body, CTA, and hashtags in real-time with an ink-style caret and adaptive line reveal.
- **Anti-"AI look" Editorial Design**:
  - Warm paper (`#F6F1E7`), ink (`#1C1A17`), and single vermilion accent (`#D8431F`).
  - Google Fonts: *Newsreader* (editorial serif), *Instrument Sans* (controls), *IBM Plex Mono* (typesetter notes).
  - Ruled paper background inside the brief textarea (28px lines).
  - Inline SVG paper grain texture.
  - No purple/blue gradients, glow effects, or AI sparkle badges.
- **One-Click Stamping & Copy**:
  - Click "Copy post" to stamp the proof sheet with an animated flat accent `COPIED` rubber stamp (rotated -4°).
  - Individual block copy buttons with 400ms highlight flash.
  - Interactive hashtags: click any tag to strike it out and exclude it from the copied text.
- **Inline Editing & Single-Variant Rewrite**:
  - Click "Edit" to modify any field directly before copying.
  - Click "Rewrite this one" to regenerate a specific proof without touching the others.
- **The Ledger (History)**:
  - Local-first IndexedDB persistence (with localStorage fallback), capped at 200 items.
  - Slide-over ledger from the right, grouped by day.
  - Full-text search across topic and content.
  - One-click copy directly from ledger rows.
  - Export to JSON and CSV.
  - Sync-ready schema (`updatedAt`, `deviceId`, `schemaVersion: 1`, `deleted`) for v2 cloud sync.
- **Anti-abuse & Security**:
  - Short-window IP burst limiter (20 generations per 10 minutes) with standard `Retry-After` headers.
  - Gemini API key strictly confined to the backend server.
  - Editorial fallback generator when running without an API key or during development.

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Gemini API key (optional — if omitted, a realistic editorial fallback generator runs automatically):
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
ALLOWED_ORIGIN=http://localhost:5173
```

### 3. Run development servers
```bash
npm run dev
```
- Client runs on `http://localhost:5173` (with Vite proxy to port 3000)
- Server runs on `http://localhost:3000`

### 4. Run tests
```bash
npm test
```

### 5. Build for production
```bash
npm run build
npm run start -w server
```
