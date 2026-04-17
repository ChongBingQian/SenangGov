import { buildRagInstruction, retrieveKnowledgeContext } from './functions/api/rag.js';

const CLOUDFLARE_MODEL = '@cf/meta/llama-3-8b-instruct';
const GEMINI_DEFAULT_MODEL = 'gemini-2.0-flash';

async function runGeminiModel(env, messages) {
  const apiKey = env?.AI_assistant || env?.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = env?.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;
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
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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

async function runAiModel(env, messages) {
  const geminiResponse = await runGeminiModel(env, messages);
  if (geminiResponse) {
    return geminiResponse;
  }

  if (env?.AI?.run) {
    return env.AI.run(CLOUDFLARE_MODEL, { messages });
  }

  const token = env?.CLOUDFLARE_API_TOKEN;
  const accountId = env?.CLOUDFLARE_ACCOUNT_ID;

  if (!token || !accountId) {
    throw new Error('AI is not configured. Set AI_assistant (or GEMINI_API_KEY), or add Cloudflare AI binding/token.');
  }

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CLOUDFLARE_MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Cloudflare AI API error (${response.status}): ${details.slice(0, 300)}`);
  }

  const data = await response.json();
  return {
    response: data?.result?.response || data?.response || '',
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/ai' && request.method === 'POST') {
      return handleAiRequest(request, env);
    }

    // Serve static Vite build assets for all non-API routes.
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleAiRequest(request, env) {
  try {
    const payload = await request.json();
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

    if (inboundMessages.length > 0) {
      for (const msg of inboundMessages) {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    const aiResponse = await runAiModel(env, messages);

    return new Response(JSON.stringify({
      text: aiResponse.response,
      sources: ragContext.map((entry) => entry.title),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err?.message || 'Unknown error',
        text: 'Error connecting to AI provider.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
