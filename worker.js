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
    const messages = [];

    if (payload.systemInstruction) {
      messages.push({ role: 'system', content: payload.systemInstruction });
    }

    if (Array.isArray(payload.messages)) {
      for (const msg of payload.messages) {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', { messages });

    return new Response(JSON.stringify({ text: aiResponse.response }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err?.message || 'Unknown error',
        text: 'Error connecting to Cloudflare AI.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
