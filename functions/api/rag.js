const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'i', 'in', 'is', 'it',
  'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'what', 'when', 'where', 'which', 'with',
  'my', 'me', 'you', 'your', 'we', 'our', 'can', 'do', 'does', 'should', 'need', 'about'
]);

const KNOWLEDGE_BASE = [
  {
    id: 'passport-online-eligibility',
    title: 'Passport online renewal eligibility',
    keywords: ['passport', 'renewal', 'online', 'counter', 'lost', 'damaged', 'oku', 'hajj', 'overseas', 'student'],
    content:
      'For myPasport online renewal in this app: users aged 13 and below must go to a counter. Existing passport is required. Lost or damaged passport should be handled at the counter. Special categories like OKU applicants, overseas students, and hajj pilgrims are directed to counter processing.',
  },
  {
    id: 'passport-fees',
    title: 'Passport fee guidance',
    keywords: ['passport', 'fee', 'rm100', 'rm200', 'age', 'senior'],
    content:
      'Passport renewal fee guidance: age 60 and above is RM100, otherwise RM200.',
  },
  {
    id: 'roadtax-requirements',
    title: 'Road tax renewal checks',
    keywords: ['road tax', 'insurance', 'blacklist', 'jpj', 'pdrm', 'puspakom', 'vehicle', 'ic'],
    content:
      'Road tax renewal readiness depends on valid insurance, no JPJ or PDRM blacklist issues, and whether PUSPAKOM inspection is required. Common details needed include vehicle information and IC details.',
  },
  {
    id: 'license-eligibility',
    title: 'Driving licence renewal eligibility',
    keywords: ['license', 'licence', 'ldl', 'pdl', 'cdl', 'vocational', 'expired'],
    content:
      'LDL is not eligible for online renewal in this app. PDL is blocked for online renewal and usually requires counter conversion to CDL. Vocational licence is not online-ready in this app and follows annual renewal guidance. CDL is online-ready when valid or expired under 3 years; expiry over 3 years is blocked for online renewal.',
  },
  {
    id: 'license-fees',
    title: 'Driving licence fee guidance',
    keywords: ['license', 'licence', 'fee', 'cdl', 'pdl', 'ldl', 'vocational', 'rm'],
    content:
      'Licence fee guidance in this app: CDL is RM30 multiplied by selected years, PDL is RM60, LDL is RM20, and vocational is RM20.',
  },
  {
    id: 'official-portals',
    title: 'Official portals for escalation',
    keywords: ['portal', 'official', 'jpj', 'immigration', 'myjpj', 'myeg'],
    content:
      'If user needs official confirmation or transaction links, direct them to Immigration eServices for passport, JPJ/MyJPJ for vehicle and licence matters, or MyEG where applicable.',
  },
];

function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  return normalized
    .split(' ')
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function getQueryText(messages = []) {
  const userMessages = messages.filter((msg) => msg?.role !== 'assistant' && typeof msg?.content === 'string');
  const tail = userMessages.slice(-2).map((msg) => msg.content).join(' ');
  return tail;
}

function scoreEntry(entry, queryTokens, queryText) {
  if (!queryTokens.length) return 0;

  const contentTokens = new Set(tokenize(entry.content));
  const titleTokens = new Set(tokenize(entry.title));
  const keywordTokens = new Set(entry.keywords.flatMap((k) => tokenize(k)));

  let score = 0;
  for (const token of queryTokens) {
    if (keywordTokens.has(token)) score += 4;
    if (titleTokens.has(token)) score += 3;
    if (contentTokens.has(token)) score += 2;
  }

  const phraseBoost = entry.keywords.some((k) => queryText.includes(normalizeText(k))) ? 2 : 0;
  return score + phraseBoost;
}

export function retrieveKnowledgeContext(messages, options = {}) {
  const { topK = 3, minScore = 3 } = options;
  const queryText = normalizeText(getQueryText(messages));
  const queryTokens = tokenize(queryText);

  if (!queryTokens.length) {
    return [];
  }

  return KNOWLEDGE_BASE
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      score: scoreEntry(entry, queryTokens, queryText),
    }))
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function buildRagInstruction(contextEntries) {
  if (!Array.isArray(contextEntries) || contextEntries.length === 0) {
    return null;
  }

  const formattedContext = contextEntries
    .map((entry, index) => `${index + 1}. ${entry.title}: ${entry.content}`)
    .join('\n');

  return [
    'Use the following SenangGov knowledge snippets as high-priority factual context when they are relevant.',
    'If snippet facts conflict with user assumptions, correct the user briefly.',
    'If snippets are not sufficient, say you are unsure and suggest the official portal.',
    'Do not mention internal IDs or scores.',
    '',
    formattedContext,
  ].join('\n');
}
