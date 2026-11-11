// Reads settings from environment variables (see ../.env.example).
require('dotenv').config();

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: required('DATABASE_URL'),
  databaseSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
  inrPerUsd: Number(process.env.INR_PER_USD || 85),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  appDeepLink: process.env.APP_DEEP_LINK || 'teenwallet://paypal-return',
  // Money tutor model. Any OpenAI-compatible provider works (Groq, Gemini, OpenRouter...). Leave the key empty to use lessons only.
  ai: {
    baseUrl: (process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, ''),
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'llama-3.1-8b-instant',
    timeoutMs: Number(process.env.AI_TIMEOUT_MS || 8000),
  },
  paypal: {
    baseUrl: process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com',
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    // Accepts either name, so a Render variable called PAYPAL_CLIENT_SECRET also works.
    secret: process.env.PAYPAL_SECRET || process.env.PAYPAL_CLIENT_SECRET || '',
    webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
  },
};
