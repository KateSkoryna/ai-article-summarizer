# AI Article Summarizer

Chrome extension that summarizes web articles using AI and extracts vocabulary for language learning. No API key needed — the backend is hosted for you.

## Install (Chrome)

**Requirements:** Chrome 114 or later

1. Download the latest `extension.zip` from the [Releases page](../../releases)
2. Unzip the file
3. Go to `chrome://extensions/` and enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the unzipped folder
5. Click the extension icon in your toolbar — the side panel opens automatically

That's it. No account, no API key, no configuration.

## What It Does

- **Summarize** any article in a structured format: main point, key insight, and context — in the article's original language and your chosen target language simultaneously
- **Vocabulary extraction** — pick a target language and CEFR level to get 15 words from the article with translations and example sentences
- **Export to PDF** — save the summary, vocabulary list, or both combined into a single document

## Privacy

Article text is sent to the hosted backend, which forwards it to the Google Gemini API. No data is stored. No account is required.

---

## For Developers

### Architecture

```
Nx Monorepo
├── apps/extension/     ← Chrome extension (React + Vite)
└── apps/backend/       ← Node.js / Express API proxy
```

```
Chrome Extension (React sidepanel)
        ↓  POST /summarize  or  POST /vocabulary
Express Backend (apps/backend)
  - Holds GEMINI_API_KEY in env
  - Rate limits: 20 req / 15 min per IP
  - Token validation via X-Extension-Token header
        ↓
Google Gemini API  (gemini-2.0-flash)
```

### Stack

- **Nx** v19 — monorepo task runner
- **Extension:** React 18 + TypeScript, Vite + `@crxjs/vite-plugin`
- **Backend:** Express + TypeScript
- **AI:** Gemini 2.5 Flash (`gemini-2.5-flash`)
- **PDF:** jspdf (npm)
- **Article extraction:** Mozilla Readability.js (local copy, loaded via `manifest.json` content scripts)

### Local Development

```bash
# Install all dependencies
npm install

# Run backend (hot reload, port 3000)
nx serve backend

# Build extension with watch
nx dev extension
```

Backend setup:

```bash
cp apps/backend/.env.example apps/backend/.env
# Set GEMINI_API_KEY in .env
# EXTENSION_TOKEN can be left empty for local dev
```

Extension connects to `http://localhost:3000` by default — no `.env` needed for local development.

### Deploy the Backend

Any Node.js host works. [Render](https://render.com) and [Railway](https://railway.app) both have free tiers.

Set these environment variables on the host:

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `EXTENSION_TOKEN` | A random secret string (e.g. `openssl rand -hex 32`) |
| `PORT` | Set automatically by most hosts; defaults to 3000 |

### Build the Extension for Distribution

```bash
VITE_BACKEND_URL=https://your-backend.onrender.com \
VITE_EXTENSION_TOKEN=your-secret-token \
nx build extension
```

Or create `apps/extension/.env` (gitignored) with those values and run `nx build extension`.

### Create a GitHub Release

```bash
cd apps/extension/dist
zip -r ../../../extension.zip .
```

Upload `extension.zip` as a release asset on GitHub. Users download, unzip, and load unpacked.

### Endpoint Contract

```
POST /summarize   { prompt: string } → { text: string }
POST /vocabulary  { prompt: string } → { text: string }
```

All requests require the `X-Extension-Token` header when `EXTENSION_TOKEN` is set on the backend.

### Key Constraints

- **No CDN scripts** — Chrome CSP requires all scripts to be local files
- **Manifest V3** — service workers only (no background pages)
- **Side Panel API** — requires Chrome 114+
- **Content scripts** loaded via `manifest.json`, not dynamically (Readability.js order matters)
- **Gemini output** capped at 4096 tokens; article content truncated to 15 000 chars before sending
- **Max prompt length** — backend rejects prompts over 20 000 characters
