// One error type for the API, plus helpers every route uses.
class HttpError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

// Lets route handlers be async without try/catch in each one.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  if (err && err.name === 'ZodError' && Array.isArray(err.issues)) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: err.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '),
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'SERVER_ERROR', message: 'Something went wrong on our side.' });
}

module.exports = { HttpError, asyncHandler, errorMiddleware };
