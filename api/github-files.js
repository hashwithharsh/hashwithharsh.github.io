// api/github-files.js - GitHub File Management API
// Vercel Serverless Function for uploading/editing .md files
//
// Required env vars (set in Vercel dashboard):
//   GITHUB_TOKEN - GitHub Personal Access Token with repo scope
//   GITHUB_REPO - Repository in format owner/repo
//   GITHUB_BRANCH - Branch name (default: main)
//   ALLOWED_ORIGIN - Your site URL

export default async function handler(req, res) {
  const ALLOWED = process.env.ALLOWED_ORIGIN || '*';

  res.setHeader('Access-Control-Allow-Origin', ALLOWED);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO;
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return res.status(500).json({
      error: 'GitHub not configured. Set GITHUB_TOKEN and GITHUB_REPO environment variables.',
    });
  }

  const { action, path, content, message, token } = req.body || {};

  // Verify admin token
  if (!token) {
    return res.status(401).json({ error: 'Admin token required' });
  }

  const isValidToken = await verifyAdminToken(token);
  if (!isValidToken) {
    return res.status(401).json({ error: 'Invalid admin token' });
  }

  try {
    if (req.method === 'GET') {
      // Get file content
      if (!path) {
        return res.status(400).json({ error: 'Path is required' });
      }

      const fileContent = await getFileContent(GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH, path);
      return res.status(200).json({ content: fileContent });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      // Create or update file
      if (!path || !content) {
        return res.status(400).json({ error: 'Path and content are required' });
      }

      const commitMessage = message || `Update ${path}`;
      const result = await createOrUpdateFile(
        GITHUB_TOKEN,
        GITHUB_REPO,
        GITHUB_BRANCH,
        path,
        content,
        commitMessage
      );

      return res.status(200).json({
        success: true,
        message: 'File updated successfully',
        ...result,
      });
    }

    if (req.method === 'DELETE') {
      // Delete file
      if (!path) {
        return res.status(400).json({ error: 'Path is required' });
      }

      const result = await deleteFile(GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH, path, message);
      return res.status(200).json({
        success: true,
        message: 'File deleted successfully',
        result,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('GitHub Files API Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process request',
    });
  }
}

async function verifyAdminToken(token) {
  // Import admin-auth module to verify token
  try {
    const { createHmac } = await import('node:crypto');

    const sessionSecret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
    const [encodedPayload, signature] = String(token).split('.');

    if (!encodedPayload || !signature) return false;

    const expected = createHmac('sha256', sessionSecret)
      .update(encodedPayload)
      .digest('base64url');

    if (signature !== expected) return false;

    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
      if (!payload.exp || Date.now() >= payload.exp) return false;
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

async function getFileContent(token, repo, branch, path) {
  const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'hashwithharsh-admin',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null; // File doesn't exist
    }
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const data = await response.json();
  // Decode base64 content
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return {
    content,
    sha: data.sha,
    path: data.path,
  };
}

async function createOrUpdateFile(token, repo, branch, path, content, message) {
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;

  // First, check if file exists to get its SHA
  let sha = null;
  try {
    const existing = await getFileContent(token, repo, branch, path);
    if (existing) {
      sha = existing.sha;
    }
  } catch (error) {
    // File doesn't exist, that's okay
  }

  // Encode content to base64
  const encodedContent = Buffer.from(content, 'utf-8').toString('base64');

  const body = {
    message,
    content: encodedContent,
    branch,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'hashwithharsh-admin',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `GitHub API error: ${response.statusText}`);
  }

  return await response.json();
}

async function deleteFile(token, repo, branch, path, message) {
  const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;

  // Get file SHA first
  const existing = await getFileContent(token, repo, branch, path);
  if (!existing) {
    // File doesn't exist, but that's okay - consider it already deleted
    console.log(`File not found for deletion: ${path}`);
    return { success: true, message: 'File not found (already deleted)' };
  }

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'hashwithharsh-admin',
    },
    body: JSON.stringify({
      message: message || `Delete ${path}`,
      sha: existing.sha,
      branch,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `GitHub API error: ${response.statusText}`);
  }

  return await response.json();
}
