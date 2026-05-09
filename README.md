# hashwithharsh — Portfolio & Blog

**Harsh Yadav** · DevOps & Cloud Engineering Student. 
Live at → [hashwithharsh.github.io](https://hashwithharsh.github.io)

**Harsh Yadav**
DevOps • Cloud • Linux • Automation

🌐 Live: https://hashwithharsh.github.io

---

## ⚡ TL;DR (10-sec scan)

* Built a **DevOps-driven portfolio platform**
* Implemented **GitHub auto-sync (no manual commits)**
* Designed **serverless backend using Vercel**
* Created **Markdown-based CMS (content as code)**
* Simulated **CI-like workflow using GitHub API**

---

## 🧠 What This Project Really Is

This is not just a portfolio.

It’s a **mini DevOps system** that automates content delivery:

```text
Admin Panel → API → GitHub → Live Website
```

* GitHub acts as **source of truth**
* Content updates behave like **deployments**
* No manual push required

---

## 🏗️ Architecture

```text
Frontend (GitHub Pages)
        ↓
Static Website (HTML/CSS/JS)
        ↓
Vercel Serverless APIs
        ↓
GitHub Repository
        ↓
Live Updates
```

---

## 📁 Project Structure

```bash
hashwithharsh/
├── index.html
├── blog.html
├── post.html
├── projects.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── main.js
│   ├── content.js
│   └── github-sync.js
│
├── content/
│   ├── blogs.json
│   ├── projects.json
│   ├── posts/*.md
│   └── projects/*.md
│
├── api/
│   ├── contact.js
│   └── github-sync.js
│
├── admin.html
├── test-github-sync.html
└── vercel.json
```

---

## 🔥 Core Features

### 🚀 GitHub Auto-Sync (DevOps Highlight)

* Automatically syncs content to GitHub
* Only changed files are uploaded (optimized)
* Supports upload, update, delete
* Real-time sync status

---

### 🧩 Markdown-Based CMS

* Blogs & projects written in `.md`
* JSON stores metadata
* Dynamic rendering on frontend

---

### 🧑‍💻 Admin Panel (Custom CMS)

* Create/edit/delete blogs & projects
* Upload markdown files
* Built-in markdown editor
* Auto-sync toggle
* Export/import functionality

---

### ☁️ Serverless Backend

Powered by Vercel Functions:

* Contact form API
* GitHub sync API
* Admin authentication

---

### 📬 Contact System

* Email integration using Resend
* Fully serverless
* Secure API-based handling

---

## ⚙️ Tech Stack

**Frontend:** HTML • CSS • JavaScript
**Backend:** Vercel Serverless Functions
**DevOps:** GitHub • GitHub Pages • GitHub API • Vercel
**Content:** Markdown + JSON

---

## 🚀 Deployment

### 1. GitHub Pages (Frontend)

```bash
git init
git add .
git commit -m "launch"
git remote add origin https://github.com/YOUR_USERNAME/hashwithharsh
git push -u origin main
```

---

### 2. Vercel (Backend APIs)

```bash
npm i -g vercel
vercel --prod
```

---

## 🔐 Environment Variables

```bash
GITHUB_TOKEN=
GITHUB_REPO=
GITHUB_BRANCH=

ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=

RESEND_API_KEY=
CONTACT_EMAIL=
ALLOWED_ORIGIN=
```

---

## ⚙️ Setup Guide

1. Create GitHub Personal Access Token (`repo` scope)
2. Deploy API to Vercel
3. Add environment variables
4. Configure admin panel
5. Enable auto-sync
6. Test sync

---

## 🔁 DevOps Workflow

### ❌ Traditional

```text
Write → Commit → Push → Deploy
```

### ✅ This Project

```text
Write → Save → Auto Sync → Live 🚀
```

---

## 🧪 Testing

* Dedicated test page for GitHub sync
* Admin panel sync validation
* API endpoint testing

---

## ⚠️ Known Issue — Playlist Visibility Bug

### 🐞 Issue

After using **"Sync All to GitHub"**:

* Playlists may become **invisible**
* Playlist data is not included in sync

---

### 🧠 Root Cause

* Sync covers:

  * blogs.json
  * projects.json
  * markdown files
* ❌ Playlists are NOT synced
* Data gets overwritten → playlists disappear

---

### 🔧 Fix

#### Option 1 — Restore from GitHub (Recommended)

* Open GitHub repo
* Go to commit history
* Restore previous version

👉 Uses proper DevOps rollback strategy

---

#### Option 2 — Recreate Playlists

```json
[
  {
    "id": "docker-series",
    "title": "Docker Mastery Series",
    "slug": "docker-mastery-series",
    "description": "Complete guide to Docker from basics to advanced networking",
    "coverImage": "",
    "featured": true,
    "order": 1,
    "posts": [
      "docker-networking-deep-dive"
    ],
    "createdAt": "2025-04-10"
  },
  {
    "id": "linux",
    "title": "Linux Series",
    "slug": "linux",
    "description": "Linux skills for DevOps engineers",
    "coverImage": "",
    "featured": true,
    "order": 2,
    "posts": [
      "linux-for-devops",
      "prometheus-grafana-monitoring"
    ],
    "createdAt": "2025-04-10"
  }
]
```

---

### 🚀 Future Fix

* Add `playlists.json`
* Include playlists in sync pipeline
* Ensure full data consistency

---

## 🧠 DevOps Concepts Demonstrated

* API-driven automation
* Git as deployment pipeline
* Serverless architecture
* Stateless backend design
* Content-as-code system
* Environment-based configuration

---

## 🔮 Future Improvements

* CI/CD with GitHub Actions
* Docker & Kubernetes
* Database integration
* Multi-user system

---

## 💼 Why This Project Matters

* Real DevOps implementation
* Automation-first approach
* Full-stack + DevOps integration
* Production-style thinking

---

## 📢 Connect

* 🌐 Portfolio: https://hashwithharsh.dev
* 💻 GitHub: (add link)
* 🔗 LinkedIn: (add link)

---
## custom favicon added
- favicon.png in root / dir..
- added these fetching links to index.html
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png">
  <link rel="apple-touch-icon" href="/favicon.png">

## ⭐ One-Line Summary

> Built a **self-updating DevOps portfolio system** powered by GitHub automation and serverless architecture.

---

## 🏁 Final Note

Built with an **automation-first mindset**.
No frameworks. No shortcuts. Just real engineering.

