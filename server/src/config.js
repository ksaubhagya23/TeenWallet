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
  paypal: {
    baseUrl: process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com',
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    secret: process.env.PAYPAL_SECRET || '',
    webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
  },
};
