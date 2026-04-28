// api/github-files.js — hashwithharsh GitHub File Sync API
// Vercel Serverless Function
//
// Handles targeted file operations for the admin panel's GitHub auto-sync:
//   PUT    → create or update a single file (upsert)
//   DELETE → delete a single file
//   POST   → utility actions: ping (health-check)
//
// Required Vercel env vars:
//   GITHUB_TOKEN   — Personal Access Token with `repo` scope
//   GITHUB_REPO    — "owner/repo" e.g. "harshyadav/hashwithharsh"
//   GITHUB_BRANCH  — branch name (default: "main")
//   ADMIN_SESSION_SECRET — same secret used in admin-auth.js
//   ALLOWED_ORIGIN — your site URL (e.g. "https://hashwithharsh.dev")

import { createHmac } from 'node:crypto';

export default async function handler(req, res) {
  const ALLOWED = process.env.ALLOWED_ORIGIN || '*';

  res.setHeader('Access-Control-Allow-Origin',  ALLOWED);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Validate env
  const GITHUB_TOKEN  = process.env.GITHUB_TOKEN;
  const GITHUB_REPO   = process.env.GITHUB_REPO;
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return res.status(500).json({
      error: 'GitHub not configured. Set GITHUB_TOKEN and GITHUB_REPO environment variables in Vercel.',
    });
  }

  const body = req.body || {};
  const { action, path, content, message, token } = body;

  // Token validation (required for all requests)
  if (!token) {
    return res.status(401).json({ error: 'Admin token required' });
  }
  if (!verifyAdminToken(token)) {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }

  // POST: utility actions
  if (req.method === 'POST') {
    if (action === 'ping') {
      return res.status(200).json({
        ok:     true,
        repo:   GITHUB_REPO,
        branch: GITHUB_BRANCH,
      });
    }
    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  // PUT: create or update a file
  if (req.method === 'PUT') {
    if (!path || content === undefined || content === null) {
      return res.status(400).json({ error: 'path and content are required' });
    }

    try {
      const commitMessage = message || `admin: update ${path}`;
      const result = await upsertFile(GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH, path, content, commitMessage);
      return res.status(200).json({
        success: true,
        message: 'File synced to GitHub',
        path,
        sha:     result?.content?.sha || null,
        commit:  result?.commit?.sha  || null,
      });
    } catch (err) {
      console.error('[github-files] PUT error:', err.message);
      return res.status(500).json({ error: err.message || 'Failed to sync file' });
    }
  }

  // DELETE: remove a file
  if (req.method === 'DELETE') {
    if (!path) {
      return res.status(400).json({ error: 'path is required' });
    }

    try {
      const commitMessage = message || `admin: delete ${path}`;
      await deleteFile(GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH, path, commitMessage);
      return res.status(200).json({ success: true, message: 'File deleted from GitHub', path });
    } catch (err) {
      if (err.message === 'NOT_FOUND') {
        return res.status(404).json({ error: `File not found in repo: ${path}` });
      }
      console.error('[github-files] DELETE error:', err.message);
      return res.status(500).json({ error: err.message || 'Failed to delete file' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/* GitHub API helpers */

const GH_API = 'https://api.github.com';

function ghHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept':        'application/vnd.github.v3+json',
    'Content-Type':  'application/json',
    'User-Agent':    'hashwithharsh-admin/2.0',
  };
}

// Get file SHA (needed for updates). Returns null if not found.
async function getFileSha(token, repo, branch, path) {
  const url = `${GH_API}/repos/${repo}/contents/${encodeFilePath(path)}?ref=${branch}`;
  const res = await fetch(url, { headers: ghHeaders(token) });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error ${res.status}`);
  }
  const data = await res.json();
  return data.sha;
}

// Create or update a file (upsert). Content is a plain string.
async function upsertFile(token, repo, branch, path, content, commitMessage) {
  const sha     = await getFileSha(token, repo, branch, path);
  const url     = `${GH_API}/repos/${repo}/contents/${encodeFilePath(path)}`;
  const encoded = Buffer.from(content, 'utf-8').toString('base64');

  const body = { message: commitMessage, content: encoded, branch };
  if (sha) body.sha = sha; // required for updates; omit for new files

  const res = await fetch(url, {
    method:  'PUT',
    headers: ghHeaders(token),
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub PUT failed: ${res.status}`);
  }
  return res.json();
}

// Delete a file from the repo. Throws 'NOT_FOUND' if missing.
async function deleteFile(token, repo, branch, path, commitMessage) {
  const sha = await getFileSha(token, repo, branch, path);
  if (!sha) throw new Error('NOT_FOUND');

  const url = `${GH_API}/repos/${repo}/contents/${encodeFilePath(path)}`;
  const res = await fetch(url, {
    method:  'DELETE',
    headers: ghHeaders(token),
    body:    JSON.stringify({ message: commitMessage, sha, branch }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub DELETE failed: ${res.status}`);
  }
  return res.json();
}

// Encode path segments but preserve slashes
function encodeFilePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

/* Admin token verification */
function verifyAdminToken(token) {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
    const [encodedPayload, signature] = String(token).split('.');
    if (!encodedPayload || !signature) return false;

    const expected = createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64url');

    if (signature.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < signature.length; i++) {
      diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    if (diff !== 0) return false;

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    return !(!payload.exp || Date.now() >= payload.exp);
  } catch {
    return false;
  }
}
