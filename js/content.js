/* =============================================
   hashwithharsh — content.js (v2)
   Content loading: localStorage-first CMS
   ============================================= */

const CONTENT_BASE_URL = new URL('content/', window.location.href);
const KEYS = {
  blogs:    'hwh_blogs',
  projects: 'hwh_projects',
  hero:     'hwh_hero',
  about:    'hwh_about',
  stack:    'hwh_stack',
};

// ── Fetch helpers (localStorage-first) ────────

async function fetchBlogs() {
  // Admin override takes priority
  const override = localStorage.getItem(KEYS.blogs);
  if (override) {
    try {
      const data = JSON.parse(override);
      // Sort pinned first, then by date descending
      return data.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date) - new Date(a.date);
      });
    } catch { /* fall through to file fetch */ }
  }
  try {
    const res = await fetch(new URL('blogs.json', CONTENT_BASE_URL));
    if (!res.ok) throw new Error('Failed');
    return await res.json();
  } catch (e) {
    console.error('Could not load blogs:', e);
    return [];
  }
}

async function fetchProjects() {
  // Admin override takes priority
  const override = localStorage.getItem(KEYS.projects);
  if (override) {
    try {
      const data = JSON.parse(override);
      // Sort pinned first, then featured
      return data.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
    } catch { /* fall through to file fetch */ }
  }
  try {
    const res = await fetch(new URL('projects.json', CONTENT_BASE_URL));
    if (!res.ok) throw new Error('Failed');
    return await res.json();
  } catch (e) {
    console.error('Could not load projects:', e);
    return [];
  }
}

async function fetchPost(slug) {
  const res = await fetch(new URL(`posts/${encodeURIComponent(slug)}.md`, CONTENT_BASE_URL));
  if (!res.ok) throw new Error(`Post "${slug}" not found`);
  return await res.text();
}

// ── Fetch project markdown ──────────────────────
async function fetchProjectDetail(projectId) {
  const res = await fetch(new URL(`projects/${encodeURIComponent(projectId)}.md`, CONTENT_BASE_URL));
  if (!res.ok) throw new Error(`Project "${projectId}" not found`);
  return await res.text();
}

// ── Markdown Parser (simple but effective) ────────
function parseMarkdown(markdown) {
  let html = markdown;

  // Escape HTML entities (but not for our markdown markers)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&amp;(#\d+|[a-z]+);/g, '&$1;'); // Restore entities

  // Headings
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```(.*?)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Line breaks and paragraphs
  html = html.split('\n\n').map(para => {
    if (para.startsWith('<h') || para.startsWith('<pre') || para.startsWith('<ul') || para.startsWith('<ol')) {
      return para;
    }
    if (para.trim() === '') return '';
    // Check if paragraph already has block-level elements
    if (para.includes('<') && para.includes('>')) {
      return para;
    }
    return '<p>' + para.replace(/\n/g, '<br>') + '</p>';
  }).join('');

  // Unordered lists
  html = html.replace(/^\s*[-*] (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, (match) => '<ul>' + match + '</ul>');

  // Ordered lists
  html = html.replace(/^\s*\d+\. (.*?)$/gm, '<li>$1</li>');

  return html.trim();
}

// ── Hero data (admin-editable) ─────────────────
function getHeroData() {
  try {
    const stored = localStorage.getItem(KEYS.hero);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

// ── Render: Blog Items ─────────────────────────
function renderBlogItems(blogs, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!blogs.length) {
    container.innerHTML = `
      <div class="loading-state">
        <span style="color:var(--text-3)">No posts yet. Check back soon.</span>
      </div>`;
    return;
  }

  const isSubdir = window.location.pathname.includes('/post');
  const postPath = isSubdir ? '../post.html' : 'post.html';

  container.innerHTML = blogs.map(blog => {
    const d = new Date(blog.date);
    const day = d.getDate().toString().padStart(2, '0');
    const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const yr  = d.getFullYear();

    return `
    <a class="blog-item${blog.pinned ? ' featured' : ''}" href="${postPath}?slug=${blog.slug}">
      <div class="blog-date">
        <span class="blog-date-day">${day}</span>
        ${mon}<br>${yr}
      </div>
      <div class="blog-content">
        <div class="blog-item-tags">
          ${blog.tags.map(t => `<span class="blog-tag">${t}</span>`).join('')}
          ${blog.pinned ? '<span class="blog-tag" style="color:var(--accent);border-color:rgba(181,255,77,.3)">📌 pinned</span>' : ''}
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

// ── Render: Project Cards ──────────────────────
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

  const githubIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.579.688.481C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>`;
  const extIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

  container.innerHTML = projects.map(p => {
    // Format date like blogs do
    let dateHtml = '';
    if (p.date) {
      const d = new Date(p.date);
      const day = d.getDate().toString().padStart(2, '0');
      const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const yr  = d.getFullYear();
      dateHtml = `<span class="project-date">${day} ${mon} ${yr}</span>`;
    }

    return `
    <div class="project-card${p.pinned ? ' pinned' : ''}" data-project-id="${p.id}">
      <div class="project-top">
        ${dateHtml || `<span class="project-icon">${p.year || '2025'}</span>`}
        <div class="project-links">
          ${p.github ? `<a class="project-link" href="${p.github}" target="_blank" rel="noopener" title="GitHub" onclick="event.stopPropagation()">${githubIcon}</a>` : ''}
          ${p.demo   ? `<a class="project-link" href="${p.demo}"   target="_blank" rel="noopener" title="Live demo" onclick="event.stopPropagation()">${extIcon}</a>` : ''}
        </div>
      </div>
      <div class="project-title">${p.title}</div>
      <div class="project-desc">${p.description}</div>
      <div class="project-tags">
        ${p.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}
      </div>
      <div class="project-status ${p.status}">${p.status === 'active' ? 'active' : p.status === 'wip' ? 'in progress' : 'archived'}</div>
    </div>`;
  }).join('');

  // Add click handlers to project cards (but not to links)
  container.querySelectorAll('.project-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const projectId = card.dataset.projectId;
      showProjectDetail(projectId);
    });
  });
}

// ── Project Detail Modal ────────────────────────
async function showProjectDetail(projectId) {
  try {
    // Fetch project metadata and markdown
    const projects = await fetchProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    const markdown = await fetchProjectDetail(projectId);
    const htmlContent = parseMarkdown(markdown);

    // Create or update modal
    let modal = document.getElementById('projectDetailModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'projectDetailModal';
      modal.className = 'project-detail-modal';
      document.body.appendChild(modal);
    }

    // Build modal content
    const githubIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.579.688.481C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>`;
    const extIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-close">✕</div>
        <div class="modal-header">
          <h2>${project.title}</h2>
          <div class="modal-meta">
            <span class="modal-year">${project.year || '2025'}</span>
            <div class="modal-links">
              ${project.github ? `<a href="${project.github}" target="_blank" rel="noopener" title="GitHub">${githubIcon}</a>` : ''}
              ${project.demo ? `<a href="${project.demo}" target="_blank" rel="noopener" title="Live demo">${extIcon}</a>` : ''}
            </div>
          </div>
        </div>
        <div class="modal-body project-detail-content">
          ${htmlContent}
        </div>
        <div class="modal-tags">
          ${project.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}
        </div>
      </div>
    `;

    // Show modal
    modal.classList.add('active');

    // Add close handlers
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');

    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    modal.addEventListener('transitionend', () => {
      if (!modal.classList.contains('active')) {
        document.body.style.overflow = 'auto';
      }
    });

  } catch (error) {
    console.error('Failed to load project:', error);
    alert('Failed to load project details. Please try again.');
  }
}

