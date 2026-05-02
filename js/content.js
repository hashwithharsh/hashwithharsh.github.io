/* =============================================
   hashwithharsh — content.js (v5)
   Content loading with real-time refresh
   Always fetches latest content from GitHub
   Fixed for GitHub Pages deployment
   ============================================= */

// Get the base URL - works on both local and GitHub Pages
const CONTENT_BASE_URL = (function() {
  // Get the current URL
  const currentUrl = window.location.href;

  // Check if we're on GitHub Pages
  const isGitHubPages = window.location.hostname.includes('github.io');

  if (isGitHubPages) {
    // On GitHub Pages, we need to find the repository root
    // The URL structure is: https://username.github.io/repo-name/page.html
    // or: https://username.github.io/page.html (for user pages)

    const pathParts = window.location.pathname.split('/').filter(Boolean);

    // If we have more than 1 path part, we're in a repository page
    // The first part is the repo name
    if (pathParts.length > 1) {
      const repoName = pathParts[0];
      return new URL(`/${repoName}/content/`, window.location.origin);
    } else {
      // User page (no repo name in path)
      return new URL('/content/', window.location.origin);
    }
  }

  // Local development - use relative path from current page
  // This works for both root and subdirectory local setups
  const _base = window.location.href.replace(/\/[^/]*(\?.*)?$/, '/');
  return new URL('content/', _base);
})();
const KEYS = {
  blogs:    'hwh_blogs',
  projects: 'hwh_projects',
  hero:     'hwh_hero',
  about:    'hwh_about',
  stack:    'hwh_stack',
  playlists: 'hwh_playlists',
  // Version keys to track when content was last updated
  blogsVersion:    'hwh_blogs_version',
  projectsVersion: 'hwh_projects_version',
  playlistsVersion: 'hwh_playlists_version',
};

// ── Fetch helpers (always fetch from GitHub) ─────

async function fetchBlogs() {
  try {
    const url = new URL('blogs.json', CONTENT_BASE_URL);
    console.log('Fetching blogs from:', url.href);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeout);

    console.log('Blogs response status:', res.status);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();

    console.log('Blogs loaded:', data.length, 'posts');

    // Sort by pinned first, then by date
    return data.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.date) - new Date(a.date);
    });
  } catch (e) {
    console.error('Could not load blogs:', e);
    console.error('Content base URL:', CONTENT_BASE_URL.href);
    return [];
  }
}

async function fetchProjects() {
  try {
    const url = new URL('projects.json', CONTENT_BASE_URL);
    console.log('Fetching projects from:', url.href);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeout);

    console.log('Projects response status:', res.status);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();

    console.log('Projects loaded:', data.length, 'projects');

    // Sort by pinned first, then by featured
    return data.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  } catch (e) {
    console.error('Could not load projects:', e);
    console.error('Content base URL:', CONTENT_BASE_URL.href);
    return [];
  }
}

async function fetchPlaylists() {
  try {
    const url = new URL('blog-playlists.json', CONTENT_BASE_URL);
    console.log('Fetching playlists from:', url.href);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeout);

    console.log('Playlists response status:', res.status);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();

    console.log('Playlists loaded:', data.length, 'playlists');

    // Sort by order, then by featured, then by date
    return data.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  } catch (e) {
    console.error('Could not load playlists:', e);
    console.error('Content base URL:', CONTENT_BASE_URL.href);
    return [];
  }
}

async function fetchPost(slug) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(new URL(`posts/${encodeURIComponent(slug)}.md`, CONTENT_BASE_URL), {
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Post "${slug}" not found`);
    return await res.text();
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// NEW: fetch project detail markdown
async function fetchProjectPost(id) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(new URL(`projects/${encodeURIComponent(id)}.md`, CONTENT_BASE_URL), {
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Project "${id}" not found`);
    return await res.text();
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// ── Hero data (admin-editable) ─────────────────
function getHeroData() {
  try {
    const stored = localStorage.getItem(KEYS.hero);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

// ── Render: Blog Items ─────────────────────────
function renderBlogItems(blogs, containerId, playlists = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!blogs.length) {
    container.innerHTML = `
      <div class="loading-state">
        <span style="color:var(--text-3)">No posts yet. Check back soon.</span>
      </div>`;
    return;
  }

  // All HTML files sit at the same directory level.
  // Use a root-relative path so links work regardless of subdirectory deployment.
  const postPath = 'post.html';

  container.innerHTML = blogs.map(blog => {
    const d = new Date(blog.date);
    const day = d.getDate().toString().padStart(2, '0');
    const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const yr  = d.getFullYear();

    const blogTags = Array.isArray(blog.tags) ? blog.tags : [];
    const blogPlaylists = Array.isArray(playlists)
      ? playlists.filter(p => Array.isArray(p.posts) && p.posts.includes(blog.slug))
      : [];

    return `
    <a class="blog-item${blog.pinned ? ' blog-item--pinned' : ''}" href="${postPath}?slug=${encodeURIComponent(blog.slug)}">
      <div class="blog-date">
        <span class="blog-date-day">${day}</span>
        ${mon}<br>${yr}
      </div>
      <div class="blog-content">
        <div class="blog-item-tags">
          ${blogTags.map(t => `<span class="blog-tag">${escapeHtml(t)}</span>`).join('')}
          ${blogPlaylists.length > 0 ? blogPlaylists.map(p => `<span class="blog-tag" style="background:var(--accent-dim); color:var(--accent);">▶ ${escapeHtml(p.title || '')}</span>`).join('') : ''}
          ${blog.pinned ? '<span class="blog-tag blog-tag--pin">📌 pinned</span>' : ''}
        </div>
        <div class="blog-item-title">${blog.title}</div>
        <div class="blog-item-excerpt">${blog.excerpt}</div>
      </div>
      <div class="blog-meta">
        <span class="blog-read-time">${blog.readTime}</span>
        <span class="blog-arrow">→</span>
      </div>
    </a>`;
  }).join('');
}

// ── Render: Blog Playlists ──────────────────────
function renderPlaylists(playlists, blogs, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!playlists.length) {
    container.innerHTML = `
      <div class="loading-state">
        <span style="color:var(--text-3)">No playlists yet.</span>
      </div>`;
    return;
  }

  const playlistPath = 'playlist.html';

  container.innerHTML = playlists.map(playlist => {
    const postCount = Array.isArray(playlist.posts) ? playlist.posts.length : 0;
    const slug = playlist.slug ? encodeURIComponent(playlist.slug) : '';
    const title = escapeHtml(playlist.title || 'Untitled playlist');
    const description = escapeHtml(playlist.description || 'No description provided.');
    const featuredBadge = playlist.featured ? '<span class="blog-tag blog-tag--pin">⭐ featured</span>' : '';

    return `
    <a class="blog-item" href="${playlistPath}${slug ? `?slug=${slug}` : ''}">
      <div class="blog-date">
        <span class="blog-date-day">${postCount}</span>
        POSTS
      </div>
      <div class="blog-content">
        <div class="blog-item-tags">
          ${featuredBadge}
        </div>
        <div class="blog-item-title">${title}</div>
        <div class="blog-item-excerpt">${description}</div>
      </div>
      <div class="blog-meta">
        <span class="blog-read-time">playlist</span>
        <span class="blog-arrow">→</span>
      </div>
    </a>`;
  }).join('');
}

// ── Render: Project Cards ──────────────────────
// Cards are now <a> elements so the whole card is clickable.
// GitHub/demo links are <button> elements to avoid nested <a> tags (invalid HTML).
function renderProjectCards(projects, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!projects.length) {
    container.innerHTML = `
      <div class="loading-state" style="grid-column:1/-1">
        <span style="color:var(--text-3)">No projects yet.</span>
      </div>`;
    return;
  }

  // All HTML files are siblings — use a simple relative reference.
  const projectPath = 'project.html';

  const githubIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.579.688.481C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>`;
  const extIcon   = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

  container.innerHTML = projects.map(p => {
    const tags = Array.isArray(p.tags) ? p.tags : [];
    const status = p.status || 'inactive';
    const statusLabel = status === 'active' ? 'active' : status === 'wip' ? 'in progress' : 'archived';

    // Format date exactly like blog items (fall back gracefully if no date field)
    let dateBlock;
    if (p.date) {
      const d   = new Date(p.date);
      const day = d.getDate().toString().padStart(2, '0');
      const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const yr  = d.getFullYear();
      dateBlock = `<div class="blog-date project-card-date">
        <span class="blog-date-day">${day}</span>
        ${mon}<br>${yr}
      </div>`;
    } else {
      dateBlock = `<span class="project-icon">${p.year || '2025'}</span>`;
    }

    return `
    <a class="project-card${p.pinned ? ' project-card--pinned' : ''}" href="${projectPath}?id=${encodeURIComponent(p.id)}" aria-label="View ${escapeHtml(p.title || 'Project')} project">
      <div class="project-top">
        ${dateBlock}
        <div class="project-links">
          ${p.github
            ? `<button class="project-link" onclick="event.preventDefault();event.stopPropagation();window.open('${p.github}','_blank','noopener')" title="GitHub repo" aria-label="Open GitHub repo for ${escapeHtml(p.title || 'project')}">${githubIcon}</button>`
            : ''}
          ${p.demo
            ? `<button class="project-link" onclick="event.preventDefault();event.stopPropagation();window.open('${p.demo}','_blank','noopener')" title="Live demo" aria-label="Open live demo for ${escapeHtml(p.title || 'project')}">${extIcon}</button>`
            : ''}
        </div>
      </div>
      <div class="project-title">${escapeHtml(p.title || 'Untitled project')}</div>
      <div class="project-desc">${escapeHtml(p.description || 'No description available.')}</div>
      <div class="project-tags">
        ${tags.map(t => `<span class="project-tag">${escapeHtml(t)}</span>`).join('')}
      </div>
      <div class="project-card-footer">
        <div class="project-status ${status}">${statusLabel}</div>
        <span class="project-view-hint">view details →</span>
      </div>
    </a>`;
  }).join('');
}

// ── Dynamic Content Loaders ────────────────────
// These fetch the JSON files written by the admin panel sync
// and apply them to the live site DOM.

async function fetchHeroData() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(new URL('hero.json', CONTENT_BASE_URL), {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('no hero.json');
    return await res.json();
  } catch { return null; }
}

async function fetchAboutData() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(new URL('about.json', CONTENT_BASE_URL), {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('no about.json');
    return await res.json();
  } catch { return null; }
}

async function fetchStackData() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(new URL('stack.json', CONTENT_BASE_URL), {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('no stack.json');
    return await res.json();
  } catch { return null; }
}

async function fetchSettingsData() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(new URL('settings.json', CONTENT_BASE_URL), {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('no settings.json');
    return await res.json();
  } catch { return null; }
}

// ── Apply Hero ─────────────────────────────────
function applyHero(hero) {
  if (!hero) return;

  // Status badge
  const statusEl = document.querySelector('.hero-status span');
  if (statusEl && hero.status) statusEl.textContent = hero.status;

  // Name lines
  const line1 = document.querySelector('.hero-name .line1');
  const line2El = document.querySelector('.hero-name .line2');
  if (hero.name) {
    const parts = hero.name.trim().split(/\s+/);
    if (line1) line1.textContent = parts[0] || '';
    if (line2El) {
      // preserve the accent dot span
      const accentSpan = line2El.querySelector('.accent-char');
      line2El.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) n.remove(); });
      line2El.insertBefore(document.createTextNode((parts.slice(1).join(' ') || '') + (accentSpan ? '' : '.')), line2El.firstChild);
      if (!accentSpan) {
        const dot = document.createElement('span');
        dot.className = 'accent-char';
        dot.textContent = '.';
        line2El.appendChild(dot);
      }
    }
  }

  // Description
  const descEl = document.querySelector('.hero-desc');
  if (descEl && hero.description) descEl.textContent = hero.description;

  // CTAs
  const ctas = document.querySelectorAll('.hero-ctas a');
  if (ctas[0] && hero.cta1Text) {
    ctas[0].textContent = hero.cta1Text;
    if (hero.cta1Href) ctas[0].href = hero.cta1Href;
  }
  if (ctas[1] && hero.cta2Text) {
    ctas[1].textContent = hero.cta2Text;
    if (hero.cta2Href) ctas[1].href = hero.cta2Href;
  }

  // Typewriter phrases
  if (hero.phrases && hero.phrases.length) {
    window._heroTypewriterPhrases = hero.phrases;
  }
}

// ── Apply About ────────────────────────────────
function applyAbout(about) {
  if (!about) return;

  // ── Paragraphs — use IDs for reliable targeting ────────────────
  if (about.paragraphs && about.paragraphs.length) {
    about.paragraphs.forEach((text, i) => {
      const el = document.getElementById(`about-para-${i}`);
      if (el) el.innerHTML = text;
    });
  }

  // ── Stats — update data-target and visible value ───────────────
  // The counter animation in main.js reads data-target, so updating it
  // means future scroll-triggered animations use the new number too.
  if (about.stats && about.stats.length) {
    const statBoxes = document.querySelectorAll('.stat-box');
    about.stats.forEach((stat, i) => {
      if (!statBoxes[i]) return;
      const numEl   = statBoxes[i].querySelector('.stat-num');
      const labelEl = statBoxes[i].querySelector('.stat-label');
      if (numEl) {
        numEl.dataset.target = stat.value;
        const span = numEl.querySelector('span');
        if (span) span.textContent = stat.value;
      }
      if (labelEl && stat.label) labelEl.textContent = stat.label;
    });
  }

  // ── Terminal — use IDs added to index.html ─────────────────────
  const t = about.terminal;
  if (t) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && val) el.textContent = val.startsWith('"') ? val : `"${val}"`;
    };
    if (t.role)     set('tv-role', t.role);
    if (t.location) set('tv-location', t.location);
    if (t.avail) {
      const availEl = document.querySelector('.about-terminal .t-output');
      if (availEl) availEl.textContent = t.avail;
    }
    if (t.openTo) {
      const items = t.openTo.split(',').map(s => s.trim()).filter(Boolean);
      items.forEach((item, i) => {
        const el = document.getElementById(`tv-open-${i}`);
        if (el) el.textContent = `"${item}"`;
      });
    }
  }
}

// ── Apply Stack ────────────────────────────────
function applyStack(stack) {
  if (!stack || !stack.length) return;
  const grid = document.querySelector('.stack-grid');
  if (!grid) return;

  grid.innerHTML = stack.map(cat => `
    <div class="stack-category">
      <div class="stack-cat-label">${escapeHtml(cat.category)}</div>
      <div class="stack-items">
        ${(cat.items || []).map(item => `<span class="stack-tag">${escapeHtml(item)}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

// ── Apply Settings (social links) ─────────────
function applySettings(settings) {
  if (!settings) return;

  // Footer social links — update all pages
  const footerLinks = document.querySelector('.footer-links');
  if (!footerLinks) return;

  const links = [];
  if (settings.githubUrl)   links.push(`<li><a href="${settings.githubUrl}" target="_blank" rel="noopener">github</a></li>`);
  if (settings.linkedinUrl) links.push(`<li><a href="${settings.linkedinUrl}" target="_blank" rel="noopener">linkedin</a></li>`);
  if (settings.twitterUrl)  links.push(`<li><a href="${settings.twitterUrl}" target="_blank" rel="noopener">twitter</a></li>`);
  // always keep rss and email
  links.push(`<li><a href="rss.html">rss</a></li>`);
  if (settings.contactEmail) {
    links.push(`<li><a href="mailto:${settings.contactEmail}">email</a></li>`);
  }
  if (links.length) footerLinks.innerHTML = links.join('');

  // Nav social icons (if any exist as <a class="nav-social"> etc.)
  // Also update document title if siteTitle set
  if (settings.siteTitle) {
    const base = document.title.split('—')[1] || '';
    if (!document.title.includes(settings.siteTitle)) {
      // Only update if no specific page title prefix
    }
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Master: Apply All Dynamic Content ─────────
// Call this from index.html after DOMContentLoaded.
// Fetches all JSON files written by admin sync and patches the DOM.
async function applyDynamicContent() {
  const [hero, about, stack, settings] = await Promise.all([
    fetchHeroData(),
    fetchAboutData(),
    fetchStackData(),
    fetchSettingsData(),
  ]);

  applyHero(hero);
  applyAbout(about);
  applyStack(stack);
  applySettings(settings);
}

// ── Apply settings on all pages (footer links) ─
// Lighter version for non-homepage pages.
async function applyGlobalSettings() {
  const settings = await fetchSettingsData();
  applySettings(settings);
}
