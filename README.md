<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/17c4ccdb-99b2-4a50-9205-24e3d037efb7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Cloudflare Deploy + Workers AI

This repository is configured to deploy with `wrangler deploy` using:

1. A Worker entrypoint at `worker.js` for the `/api/ai` route.
2. Static assets served from `dist` via Wrangler assets config.

Use:

1. Build:
   `npm run build`
2. Deploy:
   `npm run deploy`

Optional verification before deploying:

`npm run deploy:dry`
