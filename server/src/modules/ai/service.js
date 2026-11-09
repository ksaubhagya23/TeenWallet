// AI tutor helpers. Pure functions: no database, easy to test.
// Today the tutor answers from the app's own lessons (safe and always available).
// A sponsor tool (Astropods or Elastic) can be added later by replacing buildAnswer's input.

const FALLBACK =
  "I'm your money buddy! I can help with budgeting, saving, online safety and how interest works. " +
  'Try asking, for example: "How do I save for headphones?" or "What is 50/30/20?"';

// First two sentences of a lesson, kept short for a teen.
function excerpt(body, maxSentences = 2) {
  const parts = String(body || '').split(/(?<=[.!?])\s+/).filter(Boolean);
  return parts.slice(0, maxSentences).join(' ');
}

// lesson = { id, title, body } or null. goal = the teen's most recent unfinished goal, or null.
function buildAnswer({ lesson, goal }) {
  if (!lesson) return { answer: FALLBACK, lessonId: null, source: 'fallback' };
  let answer = `${excerpt(lesson.body)} (From the lesson "${lesson.title}".)`;
  if (goal && lesson.title && /sav|goal|budget/i.test(`${lesson.title} ${lesson.topic || ''}`)) {
    const left = Math.max(Number(goal.target_paise) - Number(goal.saved_paise), 0);
    if (left > 0) answer += ` You still need Rs ${(left / 100).toFixed(0)} to reach your "${goal.title}" goal.`;
  }
  return { answer, lessonId: lesson.id, source: 'lessons' };
}

// "How can I save?" -> "how | can | i | save". Any word may match. Only letters and digits are kept,
// so nothing the user types can break the query.
function toOrQuery(question) {
  const words = String(question || '').toLowerCase().match(/[a-z0-9]+/g) || [];
  return [...new Set(words)].slice(0, 12).join(' | ');
}

module.exports = { buildAnswer, excerpt, toOrQuery, FALLBACK };
