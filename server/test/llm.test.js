const test = require('node:test');
const assert = require('node:assert');
const { createLlm, buildMessages, requestBody } = require('../src/modules/ai/llm');

const lesson = { title: 'Why saving works', body: 'Saving is good.' };
const goal = { title: 'Headphones', target_paise: '200000', saved_paise: '5000' };

function fakeFetch(status, body, log = []) {
  return async (url, opts) => {
    log.push({ url, opts });
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
}

test('is disabled without an API key and refuses to call', async () => {
  const llm = createLlm({ baseUrl: 'http://x', apiKey: '', model: 'm', fetchImpl: fakeFetch(200, {}) });
  assert.strictEqual(llm.enabled, false);
  await assert.rejects(() => llm.ask({ question: 'hi' }), /not configured/);
});

test('sends the question, lesson and goal to the chat completions endpoint', async () => {
  const log = [];
  const llm = createLlm({ baseUrl: 'https://api.example.com/v1', apiKey: 'KEY', model: 'tiny', fetchImpl: fakeFetch(200, { choices: [{ message: { content: '  Save a little each week.  ' } }] }, log) });
  const answer = await llm.ask({ question: 'How do I save?', lesson, goal });
  assert.strictEqual(answer, 'Save a little each week.');
  assert.strictEqual(log[0].url, 'https://api.example.com/v1/chat/completions');
  assert.strictEqual(log[0].opts.headers.Authorization, 'Bearer KEY');
  const body = JSON.parse(log[0].opts.body);
  assert.strictEqual(body.model, 'tiny');
  assert.strictEqual(body.messages[1].content, 'How do I save?');
  assert.match(body.messages[0].content, /Saving is good\./);
  assert.match(body.messages[0].content, /Rs 1950 is still needed/);
});

test('works with no lesson and no goal', () => {
  const m = buildMessages({ question: 'What is a budget?', lesson: null, goal: null });
  assert.strictEqual(m.length, 2);
  assert.doesNotMatch(m[0].content, /Context:/);
});

test('throws when the provider answers with an error status', async () => {
  const llm = createLlm({ baseUrl: 'http://x', apiKey: 'K', model: 'm', fetchImpl: fakeFetch(429, {}) });
  await assert.rejects(() => llm.ask({ question: 'hi' }), /answered 429/);
});

test('throws when the provider returns no text', async () => {
  const llm = createLlm({ baseUrl: 'http://x', apiKey: 'K', model: 'm', fetchImpl: fakeFetch(200, { choices: [] }) });
  await assert.rejects(() => llm.ask({ question: 'hi' }), /no text/);
});

test('gives up after the timeout', async () => {
  const slow = (url, opts) => new Promise((_, reject) => opts.signal.addEventListener('abort', () => reject(new Error('aborted'))));
  const llm = createLlm({ baseUrl: 'http://x', apiKey: 'K', model: 'm', timeoutMs: 20, fetchImpl: slow });
  await assert.rejects(() => llm.ask({ question: 'hi' }), /aborted/);
});

test('reasoning models get a bigger token budget and low reasoning effort', () => {
  const plain = requestBody({ model: 'some-model', question: 'hi', lesson: null, goal: null });
  assert.strictEqual(plain.max_tokens, 220);
  assert.strictEqual(plain.reasoning_effort, undefined);
  const reasoning = requestBody({ model: 'openai/gpt-oss-20b', question: 'hi', lesson: null, goal: null });
  assert.strictEqual(reasoning.max_tokens, 1200);
  assert.strictEqual(reasoning.reasoning_effort, 'low');
});
