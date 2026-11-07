const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { query, withTx } = require('../../db');
const { HttpError, asyncHandler } = require('../../errors');
const { signToken, requireAuth } = require('../../middleware/auth');

const router = express.Router();

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['parent', 'teen']),
});
const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

router.post('/auth/register', asyncHandler(async (req, res) => {
  const { name, email, password, role } = registerSchema.parse(req.body);
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await withTx(async (client) => {
      const r = await client.query(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
        [email, hash, name, role]
      );
      const u = r.rows[0];
      if (role === 'teen') { // every teen gets a wallet and default rules
        await client.query('INSERT INTO wallets (teen_id) VALUES ($1)', [u.id]);
        await client.query('INSERT INTO spending_rules (teen_id) VALUES ($1)', [u.id]);
      }
      return u;
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    if (err.code === '23505') throw new HttpError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');
    throw err;
  }
}));

router.post('/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const r = await query('SELECT id, name, email, role, password_hash FROM users WHERE email = $1', [email]);
  const u = r.rows[0];
  const ok = u && (await bcrypt.compare(password, u.password_hash));
  if (!ok) throw new HttpError(401, 'BAD_LOGIN', 'Wrong email or password.');
  res.json({ token: signToken(u), user: publicUser(u) });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const r = await query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
  if (r.rowCount === 0) throw new HttpError(401, 'INVALID_TOKEN', 'Please log in again.');
  const user = publicUser(r.rows[0]);
  if (user.role === 'parent') {
    const t = await query(
      `SELECT u.id, u.name, u.email FROM parent_teen_links l JOIN users u ON u.id = l.teen_id WHERE l.parent_id = $1 ORDER BY u.name`,
      [user.id]
    );
    user.teens = t.rows;
  }
  res.json(user);
}));

module.exports = router;
