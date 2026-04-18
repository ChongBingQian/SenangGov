import { buildRagInstruction, retrieveKnowledgeContext } from './functions/api/rag.js';

const DEFAULT_CLOUDFLARE_MODEL = '@cf/meta/llama-3-8b-instruct';

async function runAiModel(env, messages) {
  const model = env?.CLOUDFLARE_MODEL || DEFAULT_CLOUDFLARE_MODEL;
GEMINI_API_KEY=YOUR_REAL_KEY
GEMINI_MODEL=gemini-2.0-flash
  if (env?.AI?.run) {
    const response = await env.AI.run(model, { messages });
    return {
      response: response?.response || response?.result?.response || '',
    };
  }

  const token = env?.CLOUDFLARE_API_TOKEN;
  const accountId = env?.CLOUDFLARE_ACCOUNT_ID;

  if (!token || !accountId) {
    throw new Error('Cloudflare Workers AI is not configured. Add AI binding or set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.');
  }

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
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
