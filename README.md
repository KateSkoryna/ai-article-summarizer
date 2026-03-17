# AI Article Summarizer

Chrome extension that summarizes web articles using Google Gemini AI, with PDF export. Built as an Nx monorepo with a React sidepanel and an Express backend that holds the API key — users need zero configuration.

## Architecture

```
Nx Monorepo
├── apps/extension/     ← Chrome extension (React + Vite)
└── apps/backend/       ← Node.js / Express API proxy
```

**Data flow:**

```
Chrome Extension (React sidepanel)
        ↓  POST /summarize  or  POST /vocabulary
Express Backend (apps/backend)
  - Holds GEMINI_API_KEY in env
  - Rate limits: 20 req / 15 min per IP
        ↓
Google Gemini API  (gemini-2.5-flash)
```

## Project Structure

```
apps/
├── extension/
│   ├── src/
│   │   ├── sidepanel/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx / App.css
│   │   │   └── components/
│   │   │       ├── ArticleExtract.tsx
│   │   │       ├── ArticleDisplay.tsx
│   │   │       ├── SummaryDisplay.tsx
│   │   │       ├── VocabularyDisplay.tsx
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── StatusMessage.tsx
│   │   ├── utils/
│   │   │   ├── api.ts       ← calls backend /summarize and /vocabulary
│   │   │   └── pdf.ts       ← PDF export via jspdf npm package
│   │   └── types.ts
│   ├── manifest.json        ← Manifest V3, Side Panel API
│   ├── background.js        ← opens side panel on icon click
│   ├── content.js           ← article extraction via Readability.js
│   ├── Readability.js       ← Mozilla's article extractor (local copy)
│   ├── sidepanel.html       ← React entry HTML
│   └── vite.config.ts       ← @crxjs/vite-plugin handles CSP-safe output
└── backend/
    └── src/
        ├── main.ts              ← Express entry, port 3000
        ├── routes/
        │   ├── summarize.ts     ← POST /summarize
        │   └── vocabulary.ts    ← POST /vocabulary
        ├── middleware/
        │   └── rateLimit.ts     ← 20 req / 15 min per IP
        └── utils/
            └── gemini.ts        ← Gemini API proxy
```

## Stack

- **Nx** v19 — monorepo task runner
- **Extension:** React 18 + TypeScript, Vite + `@crxjs/vite-plugin`
- **Backend:** Express + TypeScript
- **AI:** Gemini 2.5 Flash (`gemini-2.5-flash`)
- **PDF:** jspdf (npm)
- **Article extraction:** Mozilla Readability.js (local copy, loaded via `manifest.json` content scripts)

## Development

```bash
# Install all dependencies
npm install

# Run backend (hot reload, port 3000)
nx serve backend

# Build extension → apps/extension/dist/
nx build extension

# Build extension with watch
nx dev extension
```

## Backend Setup

```bash
cp apps/backend/.env.example apps/backend/.env
# Set GEMINI_API_KEY=your_key in .env
```

Endpoint contract:

```
POST /summarize   { prompt: string } → { text: string }
POST /vocabulary  { prompt: string } → { text: string }
```

## Load Extension in Chrome

1. `nx build extension` — output goes to `apps/extension/dist/`
2. Open `chrome://extensions/` → enable Developer mode
3. Click "Load unpacked" → select `apps/extension/dist/`

## Key Constraints

- **No CDN scripts** — Chrome CSP requires all scripts to be local files
- **Manifest V3** — service workers only (no background pages)
- **Side Panel API** — requires Chrome 114+
- **Content scripts** loaded via `manifest.json`, not dynamically (Readability.js order matters)
- **Gemini output** capped at 4096 tokens; article content truncated to 15 000 chars before sending
