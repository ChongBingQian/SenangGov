# SenangGov

A React + Vite assistant that helps Malaysian users check renewal eligibility and next steps for:

- Passport renewal
- Road tax renewal
- Driving licence renewal

The app includes a chat-first UI and a Gemini-backed `/api/ai` endpoint.

## Tech Stack

- Visual Studio Code
- GPT-5.3 Codex
- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Motion (`motion/react`) for transitions
- Lucide icons
- Google Cloud Run
- Google Gemini API

## What The App Does

The main UI is in `src/App.tsx`.

### 1) AI Assistant (default screen)

- Opens on `ai_assistant` screen
- Sends conversation history to `POST /api/ai`
- Shows typing indicators, message timestamps, and sent/read status
- Uses a strict system instruction to keep responses short and ask one question at a time

### 2) Passport flow

Screens:

- `passport_landing`
- `passport_checker`
- `passport_guidance`
- `passport_checklist`

Eligibility logic checks:

- Age (`<=13` must go counter)
- Existing passport required
- Lost/damaged passport requires counter
- Special categories (OKU, overseas students, hajj pilgrims) require counter

Fee logic:

- RM100 for age 60+
- RM200 otherwise

### 3) Road tax flow

Screens:

- `roadtax_landing`
- `roadtax_checker`
- `roadtax_result`

Eligibility status:

- `ready`, `blocked`, or `pending`

Checks include:

- Insurance validity
- JPJ/PDRM blacklist status
- PUSPAKOM inspection need
- Required vehicle/IC details

### 4) Driving licence flow

Screens:

- `license_landing`
- `license_checker`
- `license_result`

Rules implemented:

- `LDL`: blocked
- `PDL`: blocked (needs counter conversion to CDL)
- `Vocational`: not online-ready in app, with annual renewal guidance
- `CDL` + valid / expired under 3 years: ready for online renewal
- Expired over 3 years: blocked

Fee logic:

- CDL: RM30 x selected years
- PDL: RM60
- LDL: RM20
- Vocational: RM20

## API Layer

The frontend calls `POST /api/ai`.

Cloud Run server implementation:

1. `server.js` (Node + Express)

Handler behavior:

- Accept JSON payload with `messages` and optional `systemInstruction`
- Retrieve relevant snippets from `functions/api/rag.js` and inject them as system context
- Normalize message roles (`user`, `assistant`, optional `system`)
- Call Google Gemini model (`gemini-2.0-flash` by default)
- Return `{ "text": "...", "sources": ["..."] }` (sources may be empty)

## Project Structure

```text
.
|-- src/
|   |-- App.tsx
|   |-- main.tsx
|   |-- index.css
|   `-- types.ts
|-- functions/
|   `-- api/
|       `-- ai.js
|-- server.js
|-- Dockerfile
|-- vite.config.ts
|-- tsconfig.json
|-- index.html
`-- metadata.json
```

Note: there is a deeply nested `functions/functions/...` folder chain with no files currently used by the app runtime.

## Local Development

Prerequisites:

- Node.js 18+
- npm

Install:

```bash
npm install
```

Run Vite dev server:

```bash
npm run dev
```

Build production assets:

```bash
npm run build
```

Preview build locally:

```bash
npm run preview
```

Type-check:

```bash
npm run lint
```

## Google Cloud Run Deployment

This repo now includes a Cloud Run runtime:

- `server.js` (Node + Express) serves `dist` and handles `POST /api/ai`
- `Dockerfile` builds the Vite app and runs the Node server on port `8080`

Cloud Run uses Gemini directly for AI responses.

### Required environment variables

- `GEMINI_API_KEY`
- Optional: `GEMINI_MODEL` (defaults to `gemini-2.0-flash`)

### Deploy with gcloud

1. Enable required services:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

2. Deploy from source (builds with the included `Dockerfile`):

```bash
gcloud run deploy senanggov \
	--source . \
	--region asia-southeast1 \
	--allow-unauthenticated \
	--set-env-vars GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

3. Open the service URL returned by Cloud Run.

### Local Cloud Run-like test

```bash
npm run build
npm run start
```

## Environment Notes

- `.env.example` includes an optional `APP_URL` placeholder.
- Runtime AI on Cloud Run uses Gemini API via `GEMINI_API_KEY`.

## NPM Scripts

From `package.json`:

- `npm run dev` - start Vite on port 3000
- `npm run build` - build frontend
- `npm run start` - run Cloud Run server (`server.js`) on `PORT` or `8080`
- `npm run preview` - preview built app
- `npm run clean` - remove `dist`
- `npm run lint` - TypeScript no-emit check

## Official Portals Linked In UI

- Immigration: https://imigresen-online.imi.gov.my/eservices/myPasport
- JPJ/MyJPJ: https://www.jpj.gov.my/myjpj/
- MyEG: https://www.myeg.com.my

## License

Apache-2.0 (based on source header in `src/App.tsx`).
