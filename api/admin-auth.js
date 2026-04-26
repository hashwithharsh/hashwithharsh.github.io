// api/admin-auth.js — hashwithharsh Admin Auth
// Vercel Serverless Function
//
// Required env vars (set in Vercel dashboard):
//   ADMIN_PASSWORD  — your chosen admin password
//   ALLOWED_ORIGIN  — your site URL (e.g. https://hashwithharsh.dev)

export default async function handler(req, res) {
  const ALLOWED = process.env.ALLOWED_ORIGIN || '*';

  res.setHeader('Access-Control-Allow-Origin', ALLOWED);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, action } = req.body || {};

  // ── Verify password ───────────────────────
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

    // Brute-force delay
    await new Promise(r => setTimeout(r, 400 + Math.random() * 200));

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Build session token: base64(timestamp + random salt)
    const payload = {
      ts:   Date.now(),
      rand: Math.random().toString(36).slice(2),
      v:    '1',
    };
    const token  = Buffer.from(JSON.stringify(payload)).toString('base64');
    const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 h

    return res.status(200).json({ success: true, token, expiry });
  }

  // ── Verify token (optional future use) ───
  if (action === 'verify') {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      const valid   = Date.now() < (payload.ts + 24 * 60 * 60 * 1000);
      return res.status(200).json({ valid });
    } catch {
      return res.status(400).json({ valid: false });
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
