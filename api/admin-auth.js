// api/admin-auth.js - hashwithharsh Admin Auth
// Vercel Serverless Function
//
// Required env vars (set in Vercel dashboard):
//   ADMIN_PASSWORD - your chosen admin password
//   ADMIN_SESSION_SECRET - random secret used to sign admin tokens
//   ALLOWED_ORIGIN - your site URL (e.g. https://hashwithharsh.dev)

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  const ALLOWED = process.env.ALLOWED_ORIGIN || '*';

  res.setHeader('Access-Control-Allow-Origin', ALLOWED);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, action, token } = req.body || {};

  if (action === 'login' || !action) {
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD env var not set!');
      return res.status(500).json({
        error: 'Admin not configured. Set ADMIN_PASSWORD environment variable in Vercel.',
      });
    }

    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 200));

    if (!constantTimeEqual(password, ADMIN_PASSWORD)) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const payload = {
      iat: Date.now(),
      exp: Date.now() + SESSION_TTL_MS,
      sid: randomBytes(16).toString('hex'),
      v:   '2',
    };
    const signedToken = signToken(payload);

    return res.status(200).json({
      success: true,
      token: signedToken,
      expiry: payload.exp,
    });
  }

  if (action === 'verify') {
    if (!token) return res.status(400).json({ error: 'Token required' });

    const payload = verifyToken(token);
    return res.status(200).json({
      valid: Boolean(payload),
      expiry: payload?.exp || null,
    });
  }

  return res.status(400).json({ error: 'Unknown action' });
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}

function signToken(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', sessionSecret())
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function verifyToken(token) {
  const [encodedPayload, signature] = String(token).split('.');
  if (!encodedPayload || !signature) return null;

  const expected = createHmac('sha256', sessionSecret())
    .update(encodedPayload)
    .digest('base64url');
  if (!constantTimeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
