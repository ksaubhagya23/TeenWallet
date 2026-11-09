// Quiz helpers. Pure functions: no database, easy to test.
const PASS_PERCENT = 60;

// A quiz with the right answers removed, safe to send to the app.
function publicQuiz(quiz) {
  const qs = (quiz && quiz.questions) || [];
  return qs.map((q, i) => ({ index: i, q: q.q, options: q.options }));
}

// answers = array of chosen option numbers, one per question (same order).
function gradeQuiz(quiz, answers) {
  const qs = (quiz && quiz.questions) || [];
  if (!Array.isArray(answers) || answers.length !== qs.length) return null;
  const results = qs.map((q, i) => ({
    index: i,
    correct: answers[i] === q.answerIndex,
    correctIndex: q.answerIndex,
    explain: q.explain || null,
  }));
  const score = results.filter((r) => r.correct).length;
  const percent = qs.length === 0 ? 0 : Math.round((score / qs.length) * 100);
  return { score, total: qs.length, percent, passed: percent >= PASS_PERCENT, results };
}

module.exports = { publicQuiz, gradeQuiz, PASS_PERCENT };
