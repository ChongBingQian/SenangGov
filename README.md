# SenangGov

A React + Vite assistant that helps Malaysian users check renewal eligibility and next steps for:

- Passport renewal
- Road tax renewal
- Driving licence renewal

The app includes a chat-first UI and a Cloudflare AI-backed `/api/ai` endpoint.

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Motion (`motion/react`) for transitions
- Lucide icons
- Cloudflare Workers (runtime + Workers AI)
- Optional Cloudflare Pages Functions route

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

Two server-side implementations exist:

1. `worker.js` (primary Worker entrypoint from `wrangler.toml`)
2. `functions/api/ai.js` (Pages Functions style route)

Both handlers:

- Accept JSON payload with `messages` and optional `systemInstruction`
- Normalize message roles (`user`, `assistant`, optional `system`)
- Call Cloudflare Workers AI model `@cf/meta/llama-3-8b-instruct`
- Return `{ "text": "..." }`

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
|-- worker.js
|-- wrangler.toml
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

## Cloudflare Deployment

Configuration (`wrangler.toml`):

- `main = "worker.js"`
- AI binding name: `AI`
- Assets served from `./dist`

Deploy Worker + static assets:

```bash
npm run build
npm run deploy
```

Dry run:

```bash
npm run deploy:dry
```

### Pages-style local test command

A Pages dev script also exists:

```bash
npm run pages:dev
```

This can be useful if you want to test with Cloudflare Pages-style routing.

## Environment Notes

- `.env.example` includes an optional `APP_URL` placeholder.
- Runtime AI path uses Cloudflare Workers AI via the `AI` binding (`env.AI`).

## NPM Scripts

From `package.json`:

- `npm run dev` - start Vite on port 3000
- `npm run build` - build frontend
- `npm run preview` - preview built app
- `npm run deploy` - deploy with Wrangler
- `npm run deploy:dry` - Wrangler dry run
- `npm run pages:dev` - serve `dist` with Pages dev
- `npm run deploy:pages` - deploy `dist` to Pages project `senanggov`
- `npm run clean` - remove `dist`
- `npm run lint` - TypeScript no-emit check

## Official Portals Linked In UI

- Immigration: https://imigresen-online.imi.gov.my/eservices/myPasport
- JPJ/MyJPJ: https://www.jpj.gov.my/myjpj/
- MyEG: https://www.myeg.com.my

## License

Apache-2.0 (based on source header in `src/App.tsx`).
