// Calls a language model through any OpenAI-compatible "chat completions" API.
// fetchImpl is injectable so tests can run without the network.

const SYSTEM_PROMPT = [
  'You are a friendly money tutor inside a teen wallet app in India. The user is a teenager.',
  'Answer in at most 3 short sentences, in simple words. Use rupees (Rs) for examples.',
  'Only help with money topics: budgeting, saving, spending, online payment safety, interest, and the app itself.',
  'If the question is about something else, say politely that you can only help with money questions.',
  'Never recommend specific stocks, crypto, loans or products. Never ask for passwords, OTPs or card details.',
  'If a lesson or goal is given below, use it. Do not invent numbers that are not given.',
].join(' ');

function buildMessages({ question, lesson, goal }) {
  const context = [];
  if (lesson) context.push(`Lesson "${lesson.title}": ${lesson.body}`);
  if (goal) {
    const left = Math.max(Number(goal.target_paise) - Number(goal.saved_paise), 0);
    context.push(`The teen's current savings goal is "${goal.title}". Rs ${(left / 100).toFixed(0)} is still needed.`);
  }
  const system = context.length ? `${SYSTEM_PROMPT}\n\nContext:\n${context.join('\n')}` : SYSTEM_PROMPT;
  return [
    { role: 'system', content: system },
    { role: 'user', content: question },
  ];
}

// Reasoning models (gpt-oss) spend tokens thinking before they answer, so they get a bigger budget
// and a low reasoning effort. Other models get the plain request.
function requestBody({ model, question, lesson, goal }) {
  const body = { model, messages: buildMessages({ question, lesson, goal }), temperature: 0.4, max_tokens: 220 };
  if (/gpt-oss/i.test(model)) {
    body.max_tokens = 1200;
    body.reasoning_effort = 'low';
  }
  return body;
}

function createLlm({ baseUrl, apiKey, model, timeoutMs = 12000, fetchImpl = fetch }) {
  const enabled = Boolean(apiKey);

  // Returns the model's answer as text. Throws if the call fails, so the caller can fall back.
  async function ask({ question, lesson = null, goal = null }) {
    if (!enabled) throw new Error('AI is not configured');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(requestBody({ model, question, lesson, goal })),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`AI provider answered ${res.status}`);
      const data = await res.json();
      const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!text || !String(text).trim()) throw new Error('AI provider returned no text');
      return String(text).trim();
    } finally {
      clearTimeout(timer);
    }
  }

  return { enabled, model, ask };
}

module.exports = { createLlm, buildMessages, requestBody, SYSTEM_PROMPT };
