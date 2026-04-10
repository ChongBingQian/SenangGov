# SenangGov

SenangGov is a Malaysian government renewal helper for:

- Passport renewal
- Road tax renewal readiness
- Driving licence renewal guidance

It includes a chat assistant with support for Gemini and Cloudflare Workers AI.

## Prerequisites

- Node.js 20+

## Setup

1. Install dependencies:

   npm install

2. Create `.env.local` with your credentials:

   GEMINI_API_KEY=your_gemini_api_key
   CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
   CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
   SERVER_PORT=3001

## Run locally

Run frontend:

npm run dev

Run API server (separate terminal):

npm run server

The frontend proxies `/api/*` calls to the Express server on `SERVER_PORT`.

## Useful scripts

- `npm run dev` - start Vite dev server
- `npm run server` - start Express API server
- `npm run build` - create production build
- `npm run preview` - preview production build
- `npm run lint` - type-check with TypeScript

## Cloudflare deployment

This repo now includes `wrangler.jsonc` and `worker.ts` for Cloudflare deploys.

- The worker serves `./dist` as static assets.
- The `/api/cloudflare-chat` endpoint runs via the Cloudflare AI binding.

Typical CI/CD deploy flow:

1. Build assets:

   npm run build

2. Upload a new worker version:

   npx wrangler versions upload
