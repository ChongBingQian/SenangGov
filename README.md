# SenangGov

SenangGov is a React + Vite web assistant for Malaysian renewal workflows:

- Passport renewal
- Road tax renewal
- Driving licence renewal

It provides a chat-first UI and a single backend API route: `POST /api/ai`.

## Features

- Guided eligibility checks with clear status outcomes (`ready`, `blocked`, `pending`)
- Rule-based flows for passport, road tax, and licence scenarios
- Retrieval-augmented prompts (RAG) for more accurate assistant answers
- Gemini API integration for assistant responses

## Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Motion (`motion/react`)
- Lucide React icons
- Express (Cloud Run runtime)
- Cloudflare Workers / Pages Functions (optional legacy runtime)

## Provider Behavior

`/api/ai` on Cloud Run (`server.js`) uses Google Gemini API.

Required:

- `GEMINI_API_KEY`

Optional:

- `GEMINI_MODEL` (default: `gemini-2.5-flash`)

Also supported as fallback names:

- `GOOGLE_API_KEY`
- `GOOGLE_GENAI_API_KEY`
- `AI_ASSISTANT` / `AI_assistant`

## Quick Start

Prerequisites:

- Node.js 18+
- npm

Install dependencies:

```bash
npm install
```

Run frontend dev server:

```bash
npm run dev
```

Build production assets:

```bash
npm run build
```

Preview built app:

```bash
npm run preview
```

Type check:

```bash
npm run lint
```

## Environment Variables

Main AI variables:

- `GEMINI_API_KEY` (required)
- `GEMINI_MODEL` (optional, default: `gemini-2.5-flash`)

Optional app variable:

- `APP_URL`

## Local Runtime Options

### Option A: Express server (Cloud Run style)

```bash
npm run build
npm run start
```

This serves `dist` and handles `POST /api/ai` through `server.js`.

### Option B: Cloudflare Pages-style local dev

```bash
npm run build
npm run pages:dev
```

## Deployment

### Google Cloud Run

1. Enable services:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

2. Deploy:

```bash
gcloud run deploy senanggov \
	--source . \
	--region asia-southeast1 \
	--allow-unauthenticated \
	--set-env-vars GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Windows PowerShell equivalent (use one line or PowerShell backticks, not `\` line continuations):

```powershell
gcloud run deploy senanggov --source . --region asia-southeast1 --allow-unauthenticated --set-env-vars GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

If PowerShell shows `gcloud` is not recognized, ensure Cloud SDK is installed and available in PATH, for example:

```powershell
$env:Path += ";$env:ProgramFiles\Google\Cloud SDK\google-cloud-sdk\bin"
gcloud --version
```

`GEMINI_API_KEY` is required by the Cloud Run runtime.

Quick verification after deploy:

- `GET /healthz` should return `{ "ok": true }`
- `GET /api/ai/status` should return `aiConfigured: true` and `provider: "google-gemini"`

### Cloudflare Workers / Pages

Optional model variable in Wrangler config:

```toml
[vars]
CLOUDFLARE_MODEL = "@cf/meta/llama-3-8b-instruct"
```

Deploy Worker:

```bash
npm run deploy
```

Version upload (uses `wrangler.jsonc`):

```bash
npm run deploy:version
```

Dry run:

```bash
npm run deploy:dry
```

Deploy static build to Pages:

```bash
npm run deploy:pages
```

## Scripts

- `npm run dev` - Vite dev server on port 3000
- `npm run build` - build frontend assets
- `npm run start` - run Express server (`server.js`)
- `npm run preview` - preview Vite build
- `npm run lint` - TypeScript check (`tsc --noEmit`)
- `npm run deploy` - Wrangler deploy
- `npm run deploy:version` - Wrangler version upload with `wrangler.jsonc`
- `npm run deploy:dry` - Wrangler dry run
- `npm run pages:dev` - local Pages dev for `dist`
- `npm run deploy:pages` - deploy `dist` to Pages project `senanggov`
- `npm run clean` - remove `dist` (Unix-style command)

## Official Portals Referenced

- Immigration (myPasport): https://imigresen-online.imi.gov.my/eservices/myPasport
- JPJ / MyJPJ: https://www.jpj.gov.my/myjpj/
- MyEG: https://www.myeg.com.my

## License

Apache-2.0.
