import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildRagInstruction, retrieveKnowledgeContext } from './functions/api/rag.js';

const app = express();

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const PORT = Number(process.env.PORT || 8080);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, 'dist');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(distDir));

async function runAiModel(messages) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini is not configured. Set GEMINI_API_KEY.');
  }

  const systemMessages = messages.filter((msg) => msg?.role === 'system' && typeof msg?.content === 'string');
  const chatMessages = messages.filter((msg) => (msg?.role === 'user' || msg?.role === 'assistant') && typeof msg?.content === 'string');

  const systemInstructionText = systemMessages.map((msg) => msg.content).join('\n\n').trim();
  const contents = chatMessages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...(systemInstructionText
          ? {
              systemInstruction: {
                parts: [{ text: systemInstructionText }],
              },
            }
          : {}),
        contents,
      }),
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${details.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = (data?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.text || '')
    .join('')
    .trim();

  return {
    response: text,
  };
}

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
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
