const test = require('node:test');
const assert = require('node:assert');
const { buildAnswer, excerpt, toOrQuery, FALLBACK } = require('../src/modules/ai/service');

test('excerpt keeps the first two sentences', () => {
  assert.strictEqual(excerpt('One. Two! Three? Four.'), 'One. Two!');
});

test('no matching lesson gives the friendly fallback', () => {
  const r = buildAnswer({ lesson: null, goal: null });
  assert.strictEqual(r.answer, FALLBACK);
  assert.strictEqual(r.source, 'fallback');
  assert.strictEqual(r.lessonId, null);
});

test('answer comes from the lesson and names it', () => {
  const r = buildAnswer({ lesson: { id: 'L1', title: 'Why saving works', topic: 'saving', body: 'Saving is good. It adds up. More text.' }, goal: null });
  assert.strictEqual(r.source, 'lessons');
  assert.strictEqual(r.lessonId, 'L1');
  assert.match(r.answer, /Saving is good\. It adds up\./);
  assert.match(r.answer, /Why saving works/);
});

test('saving answers mention how much is left on the goal', () => {
  const lesson = { id: 'L1', title: 'Why saving works', topic: 'saving', body: 'Saving is good.' };
  const r = buildAnswer({ lesson, goal: { title: 'Headphones', target_paise: '200000', saved_paise: '5000' } });
  assert.match(r.answer, /Rs 1950 to reach your "Headphones" goal/);
});

test('question becomes an any-word search and strips symbols', () => {
  assert.strictEqual(toOrQuery('How can I save?'), 'how | can | i | save');
  assert.strictEqual(toOrQuery("'; DROP TABLE x; --"), 'drop | table | x');
  assert.strictEqual(toOrQuery('???'), '');
});
