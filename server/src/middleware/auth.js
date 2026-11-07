// Checks the JWT on every protected route and the role where needed.
const jwt = require('jsonwebtoken');
const config = require('../config');
const { HttpError } = require('../errors');

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new HttpError(401, 'UNAUTHENTICATED', 'Please log in.'));
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(new HttpError(401, 'INVALID_TOKEN', 'Your session has expired. Please log in again.'));
  }
}

const requireRole = (role) => (req, res, next) =>
  req.user && req.user.role === role ? next() : next(new HttpError(403, 'FORBIDDEN', `Only a ${role} can do this.`));

module.exports = { signToken, requireAuth, requireRole };
