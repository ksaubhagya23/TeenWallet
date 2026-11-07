const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { query } = require('./db');
const { asyncHandler, errorMiddleware, HttpError } = require('./errors');

const app = express();
app.set('trust proxy', 1); // Render sits behind a proxy
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/health', asyncHandler(async (req, res) => {
  await query('SELECT 1');
  res.json({ ok: true });
}));

const payments = require('./modules/payments/routes');
app.use('/', payments.pages);

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }));
app.use('/api', require('./modules/auth/routes'));
app.use('/api', require('./modules/family/routes'));
app.use('/api', require('./modules/wallet/routes'));
app.use('/api', require('./modules/rules/routes'));
app.use('/api', payments.api);
// Still to build: goals (Channel3), learning, ai (Astropods + Elastic), notify.

app.use((req, res, next) => next(new HttpError(404, 'NOT_FOUND', `No route for ${req.method} ${req.path}`)));
app.use(errorMiddleware);

module.exports = app;
