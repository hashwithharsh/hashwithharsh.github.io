// api/contact.js — Vercel Serverless Function
// Handles contact form submissions for hashwithharsh
//
// Setup:
// 1. Set env var CONTACT_EMAIL in Vercel dashboard (your email)
// 2. Set RESEND_API_KEY (get free key at resend.com — 3k emails/month free)
// 3. Deploy this folder to Vercel

export default async function handler(req, res) {
  // CORS headers — update origin to your actual GitHub Pages URL
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://harshyadav.github.io';

  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Rate limiting (simple — Vercel Edge handles more serious cases)
  // For production, consider using Upstash Redis for proper rate limiting

  try {
    // Using Resend (free tier: 3k/month, 100/day)
    // Alternative: use Nodemailer with Gmail SMTP, or EmailJS
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const CONTACT_EMAIL  = process.env.CONTACT_EMAIL || 'harsh@hashwithharsh.dev';

    if (!RESEND_API_KEY) {
      // Fallback: just log in development
      console.log('Contact form submission:', { name, email, subject, message });
      return res.status(200).json({ success: true, note: 'Dev mode — email not sent' });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'hashwithharsh Contact <contact@hashwithharsh.dev>',
        to:      [CONTACT_EMAIL],
        replyTo: email,
        subject: `[hashwithharsh] ${subject || 'New contact from ' + name}`,
        html: `
          <div style="font-family: monospace; max-width: 600px; background: #0d0d0d; color: #e2e2e2; padding: 32px; border-radius: 8px;">
            <p style="color:#b5ff4d; margin-bottom:24px;"># hashwithharsh — new message</p>
            <p><strong style="color:#888">from:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
            <p><strong style="color:#888">subject:</strong> ${escapeHtml(subject || 'No subject')}</p>
            <hr style="border-color:#1a1a1a; margin:20px 0;" />
            <p style="white-space:pre-wrap; line-height:1.7;">${escapeHtml(message)}</p>
            <hr style="border-color:#1a1a1a; margin:20px 0;" />
            <p style="color:#444; font-size:12px;">Sent via hashwithharsh.dev contact form</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Resend error:', err);
      throw new Error('Email service failed');
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Contact handler error:', err);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
