# SenangGov

SenangGov is a React + Express assistant for Malaysian renewal workflows:

- Passport renewal guidance
- Road tax renewal guidance
- Driving licence renewal guidance

The app has:

- Frontend: Vite + React (chat-first UI)
- Backend: Express API + Gemini integration + lightweight RAG

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Express 4
- Google Gemini API

## What This App Provides

- Guided eligibility checks with statuses like `ready`, `blocked`, and `pending`
- Rule-based flows for passport, road tax, and licence scenarios
- Retrieval-augmented context from local knowledge snippets (`functions/api/rag.js`)
- API endpoint `POST /api/ai` for chat responses

## Prerequisites

- Node.js 18+
- npm

## Installation

```bash
npm install
```

## Environment Variables

Set at least one Gemini API key variable:

- `GEMINI_API_KEY` (recommended)
- `GOOGLE_API_KEY`
- `GOOGLE_GENAI_API_KEY`
- `AI_ASSISTANT`
- `AI_assistant`

Optional:

- `GEMINI_MODEL` (default: `gemini-2.5-flash`)
- `PORT` (default: `8080`)

Example PowerShell:

```powershell
$env:GEMINI_API_KEY="your_key_here"
```

## Run The Whole App (Recommended)

This is the closest local behavior to production.

1. Build frontend assets:

```bash
npm run build
```

2. Start Express server:

```bash
npm run start
```

3. Open the app:

- http://localhost:8080/

4. Verify health:

- `GET http://localhost:8080/healthz` -> `{ "ok": true }`
- `GET http://localhost:8080/api/ai/status` -> provider/model/config status

## Development Mode (Two Processes)

Use this when actively editing frontend code.

Terminal A (backend API):

```bash
npm run start
```

Terminal B (frontend with proxy):

```bash
npm run dev
```

Open:

- http://localhost:3000/

In this mode, Vite proxies `/api` and `/healthz` to `http://localhost:8080`.

## Scripts

- `npm run dev` - start Vite dev server on port 3000
- `npm run build` - build frontend into `dist`
- `npm run start` - run Express server (`server.js`) on port 8080 by default
- `npm run preview` - preview built frontend only
- `npm run lint` - TypeScript type check (`tsc --noEmit`)
- `npm run deploy:cloudrun` - deploy to Google Cloud Run
- `npm run clean` - remove `dist` (Unix-style command)

## Docker

Build and run:

```bash
docker build -t senanggov .
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key_here senanggov
```

## Cloud Run Deployment

Enable required services:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

Deploy:

```bash
gcloud run deploy senanggov --source . --region asia-southeast1 --allow-unauthenticated --set-env-vars GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

PowerShell note: use one line commands (or PowerShell backticks), not shell `\` continuations.

## API Endpoints

- `GET /healthz` - health check
- `GET /api/ai/status` - AI provider/model/config check
- `POST /api/ai` - main assistant endpoint

## Troubleshooting

- `Gemini API is not configured`
  - Set one of the API key env vars listed above.

- Frontend works but API calls fail in dev mode
  - Ensure backend (`npm run start`) is running on port 8080.

- `npm run clean` fails on Windows
  - The script uses `rm -rf`. Use PowerShell: `Remove-Item -Recurse -Force dist`.

## Official Portals Referenced

- Immigration (myPasport): https://imigresen-online.imi.gov.my/eservices/myPasport
- JPJ / MyJPJ: https://www.jpj.gov.my/myjpj/
- MyEG: https://www.myeg.com.my

## License

Apache-2.0
