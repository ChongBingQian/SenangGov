import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildRagInstruction, retrieveKnowledgeContext } from './functions/api/rag.js';

const app = express();

const MODEL = process.env.CLOUDFLARE_MODEL || '@cf/meta/llama-3-8b-instruct';
const PORT = Number(process.env.PORT || 8080);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, 'dist');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(distDir));

async function runAiModel(messages) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!token || !accountId) {
    throw new Error(
      'Cloudflare Workers AI is not configured. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.'
    );
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Cloudflare Workers AI API error (${response.status}): ${details.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.result?.response || data?.response || '';

  return {
    response: text,
  };
}

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/api/ai/status', (_req, res) => {
  const tokenConfigured = Boolean(process.env.CLOUDFLARE_API_TOKEN);
  const accountConfigured = Boolean(process.env.CLOUDFLARE_ACCOUNT_ID);
  const aiConfigured = tokenConfigured && accountConfigured;

  res.status(200).json({
    ok: true,
    aiConfigured,
    provider: aiConfigured ? 'cloudflare-workers-ai-rest' : null,
    model: MODEL,
  });
});

app.post('/api/ai', async (req, res) => {
  try {
    const payload = req.body || {};
    const inboundMessages = Array.isArray(payload.messages) ? payload.messages : [];
    const ragContext = retrieveKnowledgeContext(inboundMessages);
    const ragInstruction = buildRagInstruction(ragContext);
    const messages = [];

    if (payload.systemInstruction) {
      messages.push({ role: 'system', content: payload.systemInstruction });
    }

    if (ragInstruction) {
      messages.push({ role: 'system', content: ragInstruction });
    }

    for (const msg of inboundMessages) {
      messages.push({
        role: msg?.role === 'assistant' ? 'assistant' : 'user',
        content: msg?.content,
      });
    }

    const aiResponse = await runAiModel(messages);

    res.status(200).json({
      text: aiResponse.response,
      sources: ragContext.map((entry) => entry.title),
    });
  } catch (err) {
    res.status(500).json({
      error: err?.message || 'Unknown error',
      text: 'Error connecting to Cloudflare Workers AI.',
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Cloud Run server listening on ${PORT}`);
});
