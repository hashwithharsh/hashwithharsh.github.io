// api/github-sync.js - GitHub Auto-Sync API
// Vercel Serverless Function
//
// Required env vars (set in Vercel dashboard):
//   GITHUB_TOKEN - GitHub Personal Access Token with repo scope
//   GITHUB_REPO - Repository in format "owner/repo" (e.g., "harshyadav/hashwithharsh")
//   GITHUB_BRANCH - Branch name (default: main)
//   ALLOWED_ORIGIN - Your site URL for CORS

import { createHmac } from 'node:crypto';

const ALLOWED = process.env.ALLOWED_ORIGIN || '*';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

// GitHub API base URL
const GITHUB_API = 'https://api.github.com';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', ALLOWED);
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify GitHub credentials are configured
  if (!GITHUB_TOKEN) {
    return res.status(500).json({
      error: 'GitHub not configured. Set GITHUB_TOKEN environment variable in Vercel.',
    });
  }
  if (!GITHUB_REPO) {
    return res.status(500).json({
      error: 'GitHub not configured. Set GITHUB_REPO environment variable in Vercel.',
    });
  }

  const { action, path, content, message, sha, verifyToken } = req.body || {};

  // Verify admin session (optional but recommended)
  if (verifyToken) {
    const isValid = await verifyAdminToken(verifyToken);
    if (!isValid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    switch (action) {
      case 'read':
        return await handleRead(req, res, path);
      case 'write':
        return await handleWrite(req, res, path, content, message, sha);
      case 'commit':
        return await handleCommit(req, res, message);
      case 'status':
        return await handleStatus(req, res);
      case 'list':
        return await handleList(req, res, path);
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('GitHub sync error:', error);
    return res.status(500).json({
      error: error.message || 'GitHub operation failed',
      details: error.response?.data || null,
    });
  }
}

// ─── GitHub API Helpers ───────────────────────────

async function githubRequest(endpoint, options = {}) {
  const url = `${GITHUB_API}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'User-Agent': 'hashwithharsh-admin',
    'Accept': 'application/vnd.github.v3+json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    error.response = { status: response.status, data: await response.json().catch(() => ({})) };
    throw error;
  }

  return response.json();
}

async function getFileSha(path) {
  try {
    const data = await githubRequest(`/repos/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`);
    return data.sha;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

// ─── Action Handlers ─────────────────────────────

async function handleRead(req, res, path) {
  if (!path) return res.status(400).json({ error: 'Path is required' });

  const data = await githubRequest(`/repos/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`);

  if (data.type === 'file') {
    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return res.status(200).json({
      success: true,
      path,
      content,
      sha: data.sha,
      size: data.size,
    });
  }

  return res.status(400).json({ error: 'Not a file' });
}

async function handleWrite(req, res, path, content, message, providedSha) {
  if (!path) return res.status(400).json({ error: 'Path is required' });
  if (content === undefined) return res.status(400).json({ error: 'Content is required' });

  // Get current SHA if not provided
  const sha = providedSha || await getFileSha(path);

  // Encode content to base64
  const encodedContent = Buffer.from(content, 'utf-8').toString('base64');

  const commitMessage = message || `Update ${path}`;

  const body = {
    message: commitMessage,
    content: encodedContent,
    branch: GITHUB_BRANCH,
  };

  if (sha) {
    body.sha = sha;
  }

  const result = await githubRequest(`/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return res.status(200).json({
    success: true,
    path,
    sha: result.content.sha,
    commit: {
      sha: result.commit.sha,
      message: result.commit.message,
      url: result.commit.html_url,
    },
  });
}

async function handleCommit(req, res, message) {
  // This is a no-op since write operations already commit
  // But we can return repo status
  return await handleStatus(req, res);
}

async function handleStatus(req, res) {
  const [repoData, branchData] = await Promise.all([
    githubRequest(`/repos/${GITHUB_REPO}`),
    githubRequest(`/repos/${GITHUB_REPO}/branches/${GITHUB_BRANCH}`),
  ]);

  return res.status(200).json({
    success: true,
    repo: {
      name: repoData.name,
      full_name: repoData.full_name,
      url: repoData.html_url,
      default_branch: repoData.default_branch,
    },
    branch: {
      name: branchData.name,
      sha: branchData.commit.sha,
      commit: {
        message: branchData.commit.commit.message,
        author: branchData.commit.commit.author,
        date: branchData.commit.commit.author.date,
      },
      url: branchData.commit.html_url,
    },
  });
}

async function handleList(req, res, path) {
  const data = await githubRequest(`/repos/${GITHUB_REPO}/contents/${path || ''}?ref=${GITHUB_BRANCH}`);

  if (Array.isArray(data)) {
    const files = data.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size || 0,
      sha: item.sha,
    }));

    return res.status(200).json({
      success: true,
      path: path || '/',
      files,
    });
  }

  return res.status(400).json({ error: 'Not a directory' });
}

// ─── Admin Token Verification ─────────────────────

async function verifyAdminToken(token) {
  // This would call the admin-auth API to verify the token
  // For now, we'll do a simple verification
  try {
    const ADMIN_API = process.env.ADMIN_API_URL || 'https://hashwithharsh-api.vercel.app/api/admin-auth';
    const response = await fetch(ADMIN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token }),
    });
    const data = await response.json();
    return data.valid === true;
  } catch {
    return false;
  }
}
