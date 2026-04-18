import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildRagInstruction, retrieveKnowledgeContext } from './functions/api/rag.js';

const app = express();

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const PORT = Number(process.env.PORT || 8080);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, 'dist');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(distDir));

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.AI_ASSISTANT ||
    process.env.AI_assistant ||
    ''
  );
}

async function runAiModel(messages) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'Gemini API is not configured. Set GEMINI_API_KEY (or GOOGLE_API_KEY / GOOGLE_GENAI_API_KEY / AI_assistant).'
    );
  }

  const systemMessages = messages
    .filter((msg) => msg?.role === 'system' && typeof msg?.content === 'string')
    .map((msg) => msg.content.trim())
    .filter(Boolean);

  const contentMessages = messages
    .filter((msg) => msg?.role === 'user' || msg?.role === 'assistant')
    .filter((msg) => typeof msg?.content === 'string' && msg.content.trim().length > 0)
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

  if (contentMessages.length === 0) {
    contentMessages.push({
      role: 'user',
      parts: [{ text: 'Please provide a brief helpful response.' }],
    });
  }

  const requestBody = {
    contents: contentMessages,
    generationConfig: {
      temperature: 0.4,
    },
  };

  if (systemMessages.length > 0) {
    requestBody.systemInstruction = {
      parts: [{ text: systemMessages.join('\n\n') }],
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${details.slice(0, 300)}`);
  }

  const data = await response.json();
  const candidate = Array.isArray(data?.candidates) ? data.candidates[0] : null;
  const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
  const text = parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();

  return {
    response: text,
  };
}

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/api/ai/status', (_req, res) => {
  const aiConfigured = Boolean(getGeminiApiKey());

  res.status(200).json({
    ok: true,
    aiConfigured,
    provider: aiConfigured ? 'google-gemini' : null,
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
      text: 'Error connecting to Gemini API.',
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Cloud Run server listening on ${PORT}`);
});
