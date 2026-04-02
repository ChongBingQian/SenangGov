import { buildRagInstruction, retrieveKnowledgeContext } from './rag.js';

export async function onRequestPost({ request, env }) {
  try {
    const payload = await request.json();
    const inboundMessages = Array.isArray(payload.messages) ? payload.messages : [];
    const ragContext = retrieveKnowledgeContext(inboundMessages);
    const ragInstruction = buildRagInstruction(ragContext);

    // The frontend sends { messages: [...], systemInstruction: "..." }
    const messages = [];
    
    // Cloudflare AI models usually expect "system" and "user" / "assistant" roles.
    if (payload.systemInstruction) {
      messages.push({ role: 'system', content: payload.systemInstruction });
    }

    if (ragInstruction) {
      messages.push({ role: 'system', content: ragInstruction });
    }

    if (inboundMessages.length > 0) {
      inboundMessages.forEach(msg => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      });
    }

    // Call the Cloudflare AI binding (named "AI")
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', { messages });
    
    return new Response(JSON.stringify({
      text: response.response,
      sources: ragContext.map((entry) => entry.title),
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, text: "Error connecting to Cloudflare AI." }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
