/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
app.use(express.json());

const CLOUDFLARE_MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT =
  'You are SenangGov Assistant, a helpful AI for Malaysian government services (Passports, Road Tax, Licenses). \n\nRULES:\n1. Keep responses EXTREMELY SHORT and SIMPLE.\n2. If checking eligibility/status, ask ONLY ONE question at a time. Wait for the user\'s answer before asking the next one. \n3. Ask about 4-5 questions in total before giving a final conclusion.\n4. Base guidance on official Malaysian rules. If unsure, suggest official JPJ/Immigration portals.';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

app.post('/api/cloudflare-chat', async (req, res) => {
  const { messages } = req.body as { messages: ChatMessage[] };

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    res.status(500).json({ error: 'Cloudflare AI is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.' });
    return;
  }

  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'messages must be an array.' });
    return;
  }

  const cfMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CLOUDFLARE_MODEL}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: cfMessages }),
      }
    );

    if (!cfRes.ok) {
      const errorText = await cfRes.text();
      console.error('Cloudflare AI error:', cfRes.status, errorText);
      res.status(cfRes.status).json({ error: 'Cloudflare AI request failed.' });
      return;
    }

    const data = (await cfRes.json()) as { result?: { response?: string }; errors?: unknown[] };

    const text = data?.result?.response ?? '';
    res.json({ text });
  } catch (err) {
    console.error('Cloudflare AI fetch error:', err);
    res.status(503).json({ error: 'Could not reach Cloudflare AI. Please try again later.' });
  }
});

const PORT = process.env.SERVER_PORT || 3001;
app.listen(PORT, () => {
  console.log(`SenangGov API server running on port ${PORT}`);
});
