const test = require('node:test');
const assert = require('node:assert');
const { publicQuiz, gradeQuiz } = require('../src/modules/lessons/service');
const { goalView } = require('../src/modules/goals/service');

const quiz = { questions: [
  { q: 'A?', options: ['x', 'y'], answerIndex: 1, explain: 'because' },
  { q: 'B?', options: ['x', 'y'], answerIndex: 0 },
  { q: 'C?', options: ['x', 'y'], answerIndex: 0 },
] };

test('public quiz hides the answers', () => {
  const p = publicQuiz(quiz);
  assert.strictEqual(p.length, 3);
  assert.ok(p.every((q) => q.answerIndex === undefined && q.explain === undefined));
});

test('grades a quiz and passes at 60 percent', () => {
  const g = gradeQuiz(quiz, [1, 0, 1]);
  assert.strictEqual(g.score, 2);
  assert.strictEqual(g.percent, 67);
  assert.strictEqual(g.passed, true);
});

test('fails below 60 percent', () => {
  const g = gradeQuiz(quiz, [0, 1, 1]);
  assert.strictEqual(g.score, 0);
  assert.strictEqual(g.passed, false);
});

test('wrong number of answers is rejected', () => {
  assert.strictEqual(gradeQuiz(quiz, [1, 0]), null);
  assert.strictEqual(gradeQuiz(quiz, 'abc'), null);
});

test('goal progress is a percent capped at 100', () => {
  const row = { id: 'g', title: 'Headphones', target_paise: '200000', saved_paise: '50000', created_at: 'now' };
  const v = goalView(row);
  assert.strictEqual(v.percent, 25);
  assert.strictEqual(v.remainingPaise, 150000);
  assert.strictEqual(v.reached, false);
  assert.strictEqual(goalView({ ...row, saved_paise: '250000' }).percent, 100);
  assert.strictEqual(goalView({ ...row, saved_paise: '200000' }).reached, true);
});
