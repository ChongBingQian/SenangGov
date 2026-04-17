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
- Cloudflare Workers AI only (Worker binding or Cloudflare REST API)

## Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Motion (`motion/react`)
- Lucide React icons
- Express (Cloud Run runtime)
- Cloudflare Workers / Pages Functions (Worker runtime)

## Provider Behavior

`/api/ai` uses Cloudflare Workers AI only.

Cloud Run (`server.js`):

- Uses Cloudflare REST API
- Requires both: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`

Cloudflare Worker (`worker.js` and `functions/api/ai.js`):

1. Uses AI binding (`env.AI.run`) when available
2. Falls back to Cloudflare REST API (`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`)

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

- `CLOUDFLARE_API_TOKEN` (required for REST API mode)
- `CLOUDFLARE_ACCOUNT_ID` (required for REST API mode)
- `CLOUDFLARE_MODEL` (optional, default: `@cf/meta/llama-3-8b-instruct`)

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
	--set-env-vars CLOUDFLARE_API_TOKEN=YOUR_CF_TOKEN,CLOUDFLARE_ACCOUNT_ID=YOUR_CF_ACCOUNT_ID
```

Windows PowerShell equivalent (use one line or PowerShell backticks, not `\` line continuations):

```powershell
gcloud run deploy senanggov --source . --region asia-southeast1 --allow-unauthenticated --set-env-vars CLOUDFLARE_API_TOKEN=YOUR_CF_TOKEN,CLOUDFLARE_ACCOUNT_ID=YOUR_CF_ACCOUNT_ID
```

If PowerShell shows `gcloud` is not recognized, ensure Cloud SDK is installed and available in PATH, for example:

```powershell
$env:Path += ";$env:ProgramFiles\Google\Cloud SDK\google-cloud-sdk\bin"
gcloud --version
```

Both `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are required by the Cloud Run runtime.

Quick verification after deploy:

- `GET /healthz` should return `{ "ok": true }`
- `GET /api/ai/status` should return `aiConfigured: true` and `provider: "cloudflare-workers-ai-rest"`

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
