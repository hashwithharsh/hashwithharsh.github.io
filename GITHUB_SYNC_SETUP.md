# GitHub Auto-Sync Setup Guide

This guide explains how to set up the GitHub auto-sync feature for the hashwithharsh admin panel.

## Overview

The GitHub auto-sync feature automatically pushes changes made in the admin panel to your GitHub repository. This includes:
- Project metadata (`content/projects.json`)
- Blog metadata (`content/blogs.json`)
- Project markdown files (`content/projects/*.md`)
- Blog post markdown files (`content/posts/*.md`)

## Prerequisites

1. A GitHub repository for your portfolio
2. A Vercel account (for hosting the API)
3. A GitHub Personal Access Token (PAT)

## Step 1: Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "hashwithharsh-admin")
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
5. Click "Generate token"
6. **Important:** Copy the token immediately — you won't see it again!

## Step 2: Deploy the API to Vercel

1. Push your code to GitHub (including the new `api/github-sync.js` file)
2. Connect your repository to Vercel
3. Deploy the project

## Step 3: Configure Environment Variables in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables and add:

| Variable | Value | Description |
|----------|-------|-------------|
| `GITHUB_TOKEN` | Your GitHub PAT from Step 1 | Authentication for GitHub API |
| `GITHUB_REPO` | `owner/repo` (e.g., `harshyadav/hashwithharsh`) | Your GitHub repository |
| `GITHUB_BRANCH` | `main` (or your default branch) | Branch to push changes to |
| `ALLOWED_ORIGIN` | Your site URL (e.g., `https://hashwithharsh.dev`) | CORS allowed origin |
| `ADMIN_PASSWORD` | Your admin password | For admin authentication |
| `ADMIN_SESSION_SECRET` | Random string | For session signing |

**Important:** After adding environment variables, redeploy your Vercel project for changes to take effect.

## Step 4: Configure the Admin Panel

1. Open your admin panel (`admin.html`)
2. Go to Settings → GitHub Auto-Sync
3. Enter your GitHub Sync API URL (e.g., `https://your-project.vercel.app/api/github-sync`)
4. Enable "Auto-sync on save" if you want automatic syncing
5. Click "Test connection" to verify everything is working
6. Click "Save settings"

## Step 5: Test the Sync

1. Make a change in the admin panel (e.g., add a new project)
2. Click "Save all" or "Sync to GitHub"
3. Check your GitHub repository — you should see a new commit with your changes

## How It Works

### Manual Sync
- Click the "↻ sync to github" button in the top bar
- Or go to Settings → GitHub Auto-Sync and click "Sync now"

### Auto-Sync
- When enabled, changes are automatically synced 2 seconds after saving
- This prevents multiple rapid syncs when making several changes
- You can disable auto-sync in Settings if you prefer manual control

### What Gets Synced
- `content/projects.json` — Project metadata
- `content/blogs.json` — Blog post metadata
- `content/projects/*.md` — Project markdown files
- `content/posts/*.md` — Blog post markdown files

## Troubleshooting

### "Connection failed" error
- Verify your GitHub PAT has the correct scopes
- Check that `GITHUB_REPO` is in the correct format (`owner/repo`)
- Ensure your Vercel environment variables are set correctly
- Try redeploying your Vercel project

### "Unauthorized" error
- Verify your admin session is valid
- Check that `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` are set in Vercel

### Sync not working after save
- Check if auto-sync is enabled in Settings
- Look at the browser console for error messages
- Verify the GitHub Sync API URL is correct

### File not found errors
- This is normal for new files — the sync will create them
- Check that the file paths in your JSON match the actual markdown files

## Security Notes

- **Never commit your GitHub PAT** to the repository
- Always use environment variables for sensitive data
- Use a dedicated PAT for this feature (not your main account token)
- Consider using a fine-grained token with minimal permissions
- Regularly rotate your PATs

## API Reference

### Endpoints

#### `POST /api/github-sync`

**Actions:**

- `read` — Read a file from GitHub
  ```json
  {
    "action": "read",
    "path": "content/projects.json",
    "verifyToken": "your-admin-token"
  }
  ```

- `write` — Write a file to GitHub
  ```json
  {
    "action": "write",
    "path": "content/projects.json",
    "content": "[...]",
    "message": "Update projects",
    "sha": "optional-current-sha",
    "verifyToken": "your-admin-token"
  }
  ```

- `status` — Get repository status
  ```json
  {
    "action": "status",
    "verifyToken": "your-admin-token"
  }
  ```

- `list` — List files in a directory
  ```json
  {
    "action": "list",
    "path": "content/posts",
    "verifyToken": "your-admin-token"
  }
  ```

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Vercel deployment logs
3. Check GitHub API rate limits
4. Ensure your PAT has the correct permissions
