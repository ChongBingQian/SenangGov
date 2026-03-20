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

## Cloudflare Workers AI (Optional)

The AI assistant supports **Cloudflare Workers AI** as an alternative to Google Gemini. A toggle in the chat header lets users switch between providers at any time.

To enable Cloudflare AI:

1. Obtain your **Cloudflare Account ID** from the [Cloudflare dashboard](https://dash.cloudflare.com/) (Account > Overview).
2. Create a **Cloudflare API Token** with *Workers AI (read)* permission at <https://dash.cloudflare.com/profile/api-tokens>.
3. Add the credentials to `.env.local`:
   ```
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   CLOUDFLARE_API_TOKEN=your_api_token
   ```
4. Start the API server (in a separate terminal):
   ```
   npm run server
   ```
5. Start the Vite dev server as usual:
   ```
   npm run dev
   ```

The Vite dev server proxies all `/api/*` requests to the Express server (default port `3001`).  
The model used is **`@cf/meta/llama-3.1-8b-instruct`** (Llama 3.1 8B).
