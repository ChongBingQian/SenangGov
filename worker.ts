const CLOUDFLARE_MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT =
  'You are SenangGov Assistant, a helpful AI for Malaysian government services (Passports, Road Tax, Licenses).\n\nRULES:\n1. Keep responses EXTREMELY SHORT and SIMPLE.\n2. If checking eligibility/status, ask ONLY ONE question at a time. Wait for the user\'s answer before asking the next one.\n3. Ask about 4-5 questions in total before giving a final conclusion.\n4. Base guidance on official Malaysian rules. If unsure, suggest official JPJ/Immigration portals.';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface AIResponse {
  response?: string;
  result?: {
    response?: string;
  };
}

interface WorkerEnv {
  AI: {
    run: (model: string, input: unknown) => Promise<AIResponse>;
  };
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ChatMessage>;
  return (
    (candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string'
  );
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/cloudflare-chat') {
      try {
        const body = (await request.json()) as { messages?: unknown[] };
        const incoming = body.messages;

        if (!Array.isArray(incoming) || !incoming.every(isChatMessage)) {
          return json({ error: 'messages must be an array of valid chat messages.' }, 400);
        }

        const messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...incoming.map((m) => ({ role: m.role, content: m.content })),
        ];

        const result = await env.AI.run(CLOUDFLARE_MODEL, { messages });
        const text = result.response ?? result.result?.response ?? '';

        return json({ text });
      } catch {
        return json({ error: 'Could not process Cloudflare AI request.' }, 503);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
