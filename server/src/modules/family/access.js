// Who is allowed to see or change which teen's data.
const { query } = require('../../db');
const { HttpError } = require('../../errors');

async function isParentOf(parentId, teenId, client = { query }) {
  const r = await client.query('SELECT 1 FROM parent_teen_links WHERE parent_id = $1 AND teen_id = $2', [parentId, teenId]);
  return r.rowCount > 0;
}

async function assertParentOfTeen(parentId, teenId) {
  if (!(await isParentOf(parentId, teenId))) {
    throw new HttpError(403, 'NOT_LINKED', 'This teen is not linked to your account.');
  }
}

// A teen always means themselves. A parent names a teen with ?teenId=...
// (if they have exactly one linked teen, that one is used).
async function resolveTeenId(user, requestedTeenId) {
  if (user.role === 'teen') return user.id;
  if (requestedTeenId) {
    await assertParentOfTeen(user.id, requestedTeenId);
    return requestedTeenId;
  }
  const r = await query('SELECT teen_id FROM parent_teen_links WHERE parent_id = $1', [user.id]);
  if (r.rowCount === 1) return r.rows[0].teen_id;
  if (r.rowCount === 0) throw new HttpError(400, 'NO_TEEN', 'Link a teen account first.');
  throw new HttpError(400, 'TEEN_REQUIRED', 'Say which teen with ?teenId=...');
}

module.exports = { isParentOf, assertParentOfTeen, resolveTeenId };
