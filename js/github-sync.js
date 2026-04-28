/* =============================================
   hashwithharsh — github-sync.js
   GitHub Auto-Sync Service for Admin Panel
   Optimized sync: only sync changed files
   ============================================= */

// Configuration - will be loaded from settings
const SYNC_CONFIG = {
  apiBase: 'https://hashwithharsh-api.vercel.app/api',
  enabled: true,
  autoSync: true, // Auto-sync on save
};

// Sync status tracking
const SyncStatus = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error',
};

// Queue for sync operations
const syncQueue = [];
let isProcessingQueue = false;

// ── GitHub Sync Service ─────────────────────────

class GitHubSyncService {
  constructor() {
    this.token = null;
    this.repo = null;
    this.branch = 'main';
    this.status = SyncStatus.IDLE;
    this.listeners = [];
  }

  // Initialize with admin token
  async init(adminToken) {
    this.token = adminToken;
    this.loadConfig();
    return this;
  }

  // Load sync configuration from localStorage
  loadConfig() {
    const settings = localStorage.getItem('hwh_settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        SYNC_CONFIG.enabled = parsed.githubSyncEnabled !== false;
        SYNC_CONFIG.autoSync = parsed.githubAutoSync !== false;
      } catch (e) {
        console.warn('Failed to load sync config:', e);
      }
    }
  }

  // Subscribe to status changes
  onStatusChange(callback) {
    this.listeners.push(callback);
  }

  // Notify listeners of status change
  notifyStatus(status, data = {}) {
    this.status = status;
    this.listeners.forEach(cb => cb(status, data));
  }

  // Check if sync is enabled
  isEnabled() {
    return SYNC_CONFIG.enabled && !!this.token;
  }

  // Check if auto-sync is enabled
  isAutoSyncEnabled() {
    return SYNC_CONFIG.autoSync;
  }

  // ── File Operations ─────────────────────────────

  /**
   * Upload or update a file in GitHub
   * @param {string} path - File path in repo (e.g., 'content/posts/my-post.md')
   * @param {string} content - File content
   * @param {string} message - Commit message
   * @returns {Promise<Object>} Result with success status
   */
  async uploadFile(path, content, message) {
    if (!this.isEnabled()) {
      console.log('GitHub sync is disabled');
      return { success: false, skipped: true };
    }

    this.notifyStatus(SyncStatus.SYNCING, { path });

    try {
      const response = await fetch(`${SYNC_CONFIG.apiBase}/github-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'upload',
          path,
          content,
          message,
          token: this.token,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        this.notifyStatus(SyncStatus.SUCCESS, { path, result });
        return { success: true, result };
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('GitHub sync error:', error);
      this.notifyStatus(SyncStatus.ERROR, { path, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a file from GitHub
   * @param {string} path - File path in repo
   * @param {string} message - Commit message
   * @returns {Promise<Object>} Result with success status
   */
  async deleteFile(path, message) {
    if (!this.isEnabled()) {
      return { success: false, skipped: true };
    }

    this.notifyStatus(SyncStatus.SYNCING, { path, action: 'delete' });

    try {
      const response = await fetch(`${SYNC_CONFIG.apiBase}/github-files`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path,
          message,
          token: this.token,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        this.notifyStatus(SyncStatus.SUCCESS, { path, action: 'delete' });
        return { success: true, result };
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('GitHub delete error:', error);
      this.notifyStatus(SyncStatus.ERROR, { path, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get file content from GitHub
   * @param {string} path - File path in repo
   * @returns {Promise<Object|null>} File content or null if not found
   */
  async getFile(path) {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const response = await fetch(`${SYNC_CONFIG.apiBase}/github-files`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path,
          token: this.token,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.content;
      }
      return null;
    } catch (error) {
      console.error('GitHub get file error:', error);
      return null;
    }
  }

  // ── High-Level Sync Operations ───────────────────

  /**
   * Sync a blog post to GitHub
   * @param {Object} blog - Blog post object
   * @param {string} markdownContent - Markdown content
   * @param {boolean} isDelete - Whether to delete the post
   * @returns {Promise<Object>} Sync result
   */
  async syncBlog(blog, markdownContent = null, isDelete = false) {
    if (!this.isEnabled()) {
      return { success: false, skipped: true };
    }

    const path = `content/posts/${blog.slug}.md`;

    if (isDelete) {
      return await this.deleteFile(path, `Delete blog post: ${blog.title}`);
    }

    if (!markdownContent) {
      // Only sync metadata if no markdown content
      return { success: true, skipped: true, reason: 'No markdown content' };
    }

    return await this.uploadFile(
      path,
      markdownContent,
      `Update blog post: ${blog.title}`
    );
  }

  /**
   * Sync a project to GitHub
   * @param {Object} project - Project object
   * @param {string} markdownContent - Markdown content
   * @param {boolean} isDelete - Whether to delete the project
   * @returns {Promise<Object>} Sync result
   */
  async syncProject(project, markdownContent = null, isDelete = false) {
    if (!this.isEnabled()) {
      return { success: false, skipped: true };
    }

    const path = `content/projects/${project.id}.md`;

    if (isDelete) {
      return await this.deleteFile(path, `Delete project: ${project.title}`);
    }

    if (!markdownContent) {
      return { success: true, skipped: true, reason: 'No markdown content' };
    }

    return await this.uploadFile(
      path,
      markdownContent,
      `Update project: ${project.title}`
    );
  }

  /**
   * Sync blogs.json metadata file
   * @param {Array} blogs - Array of blog objects
   * @returns {Promise<Object>} Sync result
   */
  async syncBlogsJson(blogs) {
    if (!this.isEnabled()) {
      return { success: false, skipped: true };
    }

    const content = JSON.stringify(blogs, null, 2);
    return await this.uploadFile(
      'content/blogs.json',
      content,
      'Update blog metadata'
    );
  }

  /**
   * Sync projects.json metadata file
   * @param {Array} projects - Array of project objects
   * @returns {Promise<Object>} Sync result
   */
  async syncProjectsJson(projects) {
    if (!this.isEnabled()) {
      return { success: false, skipped: true };
    }

    const content = JSON.stringify(projects, null, 2);
    return await this.uploadFile(
      'content/projects.json',
      content,
      'Update project metadata'
    );
  }

  /**
   * Sync hero section to GitHub
   * @param {Object} hero - Hero section data
   * @returns {Promise<Object>} Sync result
   */
  async syncHero(hero) {
    if (!this.isEnabled()) {
      return { success: false, skipped: true };
    }

    const content = JSON.stringify(hero, null, 2);
    return await this.uploadFile(
      'content/hero.json',
      content,
      'Update hero section'
    );
  }

  /**
   * Sync about section to GitHub
   * @param {Object} about - About section data
   * @returns {Promise<Object>} Sync result
   */
  async syncAbout(about) {
    if (!this.isEnabled()) {
      return { success: false, skipped: true };
    }

    const content = JSON.stringify(about, null, 2);
    return await this.uploadFile(
      'content/about.json',
      content,
      'Update about section'
    );
  }

  /**
   * Sync tech stack to GitHub
   * @param {Array} stack - Tech stack data
   * @returns {Promise<Object>} Sync result
   */
  async syncStack(stack) {
    if (!this.isEnabled()) {
      return { success: false, skipped: true };
    }

    const content = JSON.stringify(stack, null, 2);
    return await this.uploadFile(
      'content/stack.json',
      content,
      'Update tech stack'
    );
  }

  /**
   * Sync settings to GitHub
   * @param {Object} settings - Settings data
   * @returns {Promise<Object>} Sync result
   */
  async syncSettings(settings) {
    if (!this.isEnabled()) {
      return { success: false, skipped: true };
    }

    const content = JSON.stringify(settings, null, 2);
    return await this.uploadFile(
      'content/settings.json',
      content,
      'Update settings'
    );
  }

  /**
   * Sync all content (full sync)
   * @param {Object} data - All content data
   * @returns {Promise<Object>} Sync result
   */
  async syncAll(data) {
    if (!this.isEnabled()) {
      return { success: false, skipped: true };
    }

    this.notifyStatus(SyncStatus.SYNCING, { action: 'full_sync' });

    const results = {
      blogsJson: null,
      projectsJson: null,
      blogs: [],
      projects: [],
    };

    // Sync metadata files
    results.blogsJson = await this.syncBlogsJson(data.blogs || []);
    results.projectsJson = await this.syncProjectsJson(data.projects || []);

    // Sync blog markdown files
    for (const blog of data.blogs || []) {
      const mdKey = `hwh_blog_md_${blog.slug}`;
      const content = localStorage.getItem(mdKey);
      if (content) {
        const result = await this.syncBlog(blog, content);
        results.blogs.push({ slug: blog.slug, result });
      }
    }

    // Sync project markdown files
    for (const project of data.projects || []) {
      const mdKey = `hwh_project_md_${project.id}`;
      const content = localStorage.getItem(mdKey);
      if (content) {
        const result = await this.syncProject(project, content);
        results.projects.push({ id: project.id, result });
      }
    }

    const hasErrors = Object.values(results).some(r =>
      Array.isArray(r) ? r.some(item => !item.result?.success) : !r?.success
    );

    this.notifyStatus(
      hasErrors ? SyncStatus.ERROR : SyncStatus.SUCCESS,
      { action: 'full_sync', results }
    );

    return { success: !hasErrors, results };
  }
}

// ── Global Instance ───────────────────────────────

const githubSync = new GitHubSyncService();

// Export for use in admin panel
if (typeof window !== 'undefined') {
  window.githubSync = githubSync;
  window.SyncStatus = SyncStatus;
}
