# hashwithharsh — Portfolio & Blog

**Harsh Yadav** · DevOps & Cloud Engineering Student  
Live at → [hashwithharsh.dev](https://hashwithharsh.dev)

---

## Architecture

```
hashwithharsh/
├── index.html          ← homepage (hero, about, stack, projects preview, blog preview, contact)
├── blog.html           ← blog listing with tag filters
├── post.html           ← single post reader (loads markdown on demand)
├── projects.html       ← full projects grid with filters
│
├── css/
│   └── style.css       ← all styles (one file, no framework)
│
├── js/
│   ├── main.js         ← nav, typewriter, animations, contact form
│   └── content.js      ← fetch JSON + markdown, render to DOM
│
├── content/
│   ├── blogs.json      ← blog post metadata (title, date, slug, tags, excerpt)
│   ├── projects.json   ← project metadata
│   ├── project/
│        └── *.md        ← actual projects content (fetched on demand)
│   └── posts/
│        └── *.md        ← actual blog post content (fetched on demand)
│
├── api/
│   └── contact.js      ← Vercel serverless function (contact form email)
│
└── vercel.json         ← Vercel config (for API deployment)
```

**Key design decision:** `blogs.json` and `projects.json` only store metadata.  
The actual post content lives in `content/posts/*.md` and is fetched  
only when a visitor opens that post. This keeps initial load fast.

---

## Deployment

### 1. GitHub Pages (static site)

```bash
# Push this folder to your GitHub repo
git init
git add .
git commit -m "launch: hashwithharsh portfolio"
git remote add origin https://github.com/YOUR_USERNAME/hashwithharsh
git push -u origin main

# In GitHub repo Settings → Pages:
# Source: Deploy from branch
# Branch: main / (root)
# Your site will be live at: https://YOUR_USERNAME.github.io/hashwithharsh
```

**Custom domain setup:**
1. Add a `CNAME` file in the root containing your domain: `hashwithharsh.dev`
2. In your domain registrar, point DNS to GitHub Pages IPs:
   ```
   A   @   185.199.108.153
   A   @   185.199.109.153
   A   @   185.199.110.153
   A   @   185.199.111.153
   CNAME www YOUR_USERNAME.github.io
   ```
3. Enable "Enforce HTTPS" in GitHub Pages settings

---

### 2. Vercel Serverless API (contact form + GitHub sync)

The API folder deploys separately to Vercel to handle the contact form and GitHub auto-sync.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy just the API (from the project root)
vercel --prod

# Or deploy from the /api directory if you want a separate project
```

**Required environment variables** (set in Vercel dashboard → Settings → Environment Variables):

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Get free at [resend.com](https://resend.com) — 3k emails/month free |
| `CONTACT_EMAIL` | Your email address (where form submissions go) |
| `ALLOWED_ORIGIN` | Your GitHub Pages URL, e.g. `https://harshyadav.github.io` |
| `GITHUB_TOKEN` | GitHub Personal Access Token with `repo` scope (for auto-sync) |
| `GITHUB_REPO` | Repository in format `owner/repo`, e.g. `harshyadav/hashwithharsh` |
| `GITHUB_BRANCH` | Branch name (default: `main`) |
| `ADMIN_PASSWORD` | Admin panel password |
| `ADMIN_SESSION_SECRET` | Random secret for session signing |

**After deployment:**
Update `main.js` line with your actual Vercel API URL:
```js
const CONTACT_API = 'https://YOUR_PROJECT.vercel.app/api/contact';
```

**GitHub Auto-Sync:**
See [GITHUB_SYNC_SETUP.md](GITHUB_SYNC_SETUP.md) for detailed setup instructions.

---

## Adding Content

### New Blog Post

1. Add metadata to `content/blogs.json`:
```json
{
  "slug": "your-post-slug",
  "title": "Post Title",
  "date": "2025-04-15",
  "tags": ["docker", "devops"],
  "excerpt": "One sentence that makes someone want to read more.",
  "readTime": "8 min read"
}
```

2. Create `content/posts/your-post-slug.md` with your content in Markdown.

3. Commit and push. GitHub Pages picks it up automatically.  
   No build step. No CMS. Just files.

### New Project

Add to `content/projects.json`:
```json
{
  "id": "unique-id",
  "title": "Project Name",
  "description": "What it does and why you built it.",
  "tags": ["kubernetes", "terraform"],
  "github": "https://github.com/your/repo",
  "demo": null,
  "featured": true,
  "status": "active",
  "year": "2025"
}
```

Set `"featured": true` to show it on the homepage (shows max 3 featured).  
Status options: `"active"` | `"wip"` | `"archived"`

---

## Customization Checklist

- [ ] Update social links in `index.html` footer (GitHub, LinkedIn, Twitter, email)
- [ ] Update `CONTACT_API` URL in `js/main.js` with your Vercel URL
- [ ] Update `hero-status` text in `index.html` with what you're currently working on
- [ ] Replace stat numbers in `index.html` about section with your real numbers
- [ ] Update `content/blogs.json` with your actual blog posts
- [ ] Update `content/projects.json` with your actual projects
- [ ] Add your blog posts as `.md` files in `content/posts/`
- [ ] Set up Vercel environment variables (see above)
- [ ] Point your domain DNS to GitHub Pages
- [ ] Set up GitHub auto-sync (see [GITHUB_SYNC_SETUP.md](GITHUB_SYNC_SETUP.md))

---

## Tech Stack (the website itself)

- **Hosting:** GitHub Pages (free, automatic deploys on push)
- **API:** Vercel Serverless Functions (free tier: 100GB bandwidth/month)
- **Email:** Resend (free tier: 3,000 emails/month)
- **No frameworks.** Vanilla HTML, CSS, JavaScript.
- **No build step.** What you see is what gets deployed.
- **Fonts:** Syne (headings) + Outfit (body) + JetBrains Mono (code) via Google Fonts
- **Markdown:** marked.js (CDN) loaded only on post pages
- **Syntax highlighting:** highlight.js (CDN) loaded only on post pages

---

## Performance Notes

- Homepage loads blogs.json (~1KB) and projects.json (~2KB) on mount
- Post markdown files are fetched only when a post is opened
- All fonts are loaded via Google Fonts with `display=swap`
- No JavaScript frameworks = no bundle overhead
- Images are referenced per-post in markdown — host on GitHub or Cloudinary

---

*Built with intention. No templates, no AI-generated design.*
