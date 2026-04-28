/* =============================================
   hashwithharsh — github-sync-addon.js v2.0
   GitHub Auto-Sync for Admin Panel

   How it works:
   • Patches saveBlog / saveProject / deleteBlog / deleteProject
   • After each local save, syncs ONLY the specific file(s) that changed
   • blogs.json  → synced after any blog metadata change
   • projects.json → synced after any project metadata change
   • content/posts/<slug>.md  → synced when blog post .md is saved
   • content/projects/<id>.md → synced when project .md is saved
   • File deletes on GitHub mirror local deletes in admin panel
   • All syncs are non-blocking — local save always succeeds first
   ============================================= */
(function () {
  'use strict';

  const VERSION         = '2.0.0';
  const GH_SETTINGS_KEY = 'hwh_gh_sync_settings';

  /* ── Settings helpers ───────────────────────── */
  function getGhSettings() {
    try { return JSON.parse(localStorage.getItem(GH_SETTINGS_KEY)) || {}; }
    catch { return {}; }
  }
  function saveGhSettings(s) {
    localStorage.setItem(GH_SETTINGS_KEY, JSON.stringify(s));
  }
  function isSyncEnabled() {
    return getGhSettings().enabled !== false; // default true
  }
  function getFilesApiUrl() {
    const s = getGhSettings();
    if (s.filesApiUrl && s.filesApiUrl.trim()) return s.filesApiUrl.trim();
    // Auto-derive from the admin auth API URL (replace last segment)
    const authUrl = (typeof getAdminApiUrl === 'function')
      ? getAdminApiUrl()
      : 'https://hashwithharsh-api.vercel.app/api/admin-auth';
    return authUrl.replace(/\/[^/]+$/, '/github-files');
  }
  function getAdminToken() {
    try { return JSON.parse(localStorage.getItem('hwh_admin_session') || '{}').token || ''; }
    catch { return ''; }
  }

  /* ── Sync log ────────────────────────────────── */
  const syncLog = [];
  function addSyncLog(type, path, status, msg) {
    syncLog.unshift({ type, path, status, msg, time: new Date().toLocaleTimeString() });
    if (syncLog.length > 30) syncLog.pop();
    renderSyncLog();
  }

  /* ── Status indicator ────────────────────────── */
  let _indicator   = null;
  let _statusTimer = null;

  function setSyncStatus(mode, txt) {
    if (!_indicator) return;
    const dot  = _indicator.querySelector('.ghs-dot');
    const span = _indicator.querySelector('.ghs-txt');
    if (dot)  dot.className  = 'ghs-dot ' + mode;
    if (span) span.textContent = txt || '';
    clearTimeout(_statusTimer);
    if (mode !== 'syncing') {
      _statusTimer = setTimeout(() => {
        setSyncStatus('idle', isSyncEnabled() ? 'sync on' : 'sync off');
      }, 4500);
    }
  }

  /* ── Core API call ───────────────────────────── */
  async function ghApiCall(method, body) {
    const url = getFilesApiUrl();
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, token: getAdminToken() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  /* ── Push one file ───────────────────────────── */
  async function ghPush(path, content, commitMsg) {
    if (!isSyncEnabled()) return { skipped: 'disabled' };
    if (!getAdminToken()) throw new Error('No admin session — please log in again');

    setSyncStatus('syncing', `↑ ${path.split('/').pop()}…`);
    try {
      const result = await ghApiCall('PUT', { path, content, message: commitMsg });
      addSyncLog('push', path, 'ok', commitMsg);
      setSyncStatus('ok', `✓ ${path.split('/').pop()}`);
      return result;
    } catch (err) {
      addSyncLog('push', path, 'error', err.message);
      setSyncStatus('error', `✕ ${err.message.slice(0, 36)}`);
      throw err;
    }
  }

  /* ── Delete one file ─────────────────────────── */
  async function ghDelete(path, commitMsg) {
    if (!isSyncEnabled()) return { skipped: 'disabled' };
    if (!getAdminToken()) throw new Error('No admin session');

    setSyncStatus('syncing', `⌫ ${path.split('/').pop()}…`);
    try {
      const result = await ghApiCall('DELETE', { path, message: commitMsg });
      addSyncLog('delete', path, 'ok', commitMsg);
      setSyncStatus('ok', `✓ removed ${path.split('/').pop()}`);
      return result;
    } catch (err) {
      // 404 / "not found" is fine — file simply wasn't in GitHub yet
      if (/not found|404/i.test(err.message)) {
        addSyncLog('delete', path, 'skipped', 'not in repo');
        setSyncStatus('ok', 'already gone');
        return { notFound: true };
      }
      addSyncLog('delete', path, 'error', err.message);
      setSyncStatus('error', `✕ ${err.message.slice(0, 36)}`);
      throw err;
    }
  }

  /* ── Named sync helpers ──────────────────────── */
  async function syncBlogsJson(label) {
    const blogs   = window.state?.blogs || [];
    const content = JSON.stringify(blogs, null, 2);
    return ghPush('content/blogs.json', content, label || 'admin: update blogs.json');
  }

  async function syncProjectsJson(label) {
    const projects = window.state?.projects || [];
    const content  = JSON.stringify(projects, null, 2);
    return ghPush('content/projects.json', content, label || 'admin: update projects.json');
  }

  async function syncBlogMd(slug, mdContent) {
    if (!slug || !mdContent) return { skipped: 'empty' };
    return ghPush(
      `content/posts/${slug}.md`,
      mdContent,
      `admin: update post "${slug}"`
    );
  }

  async function syncProjectMd(id, mdContent) {
    if (!id || !mdContent) return { skipped: 'empty' };
    return ghPush(
      `content/projects/${id}.md`,
      mdContent,
      `admin: update project "${id}"`
    );
  }

  /* ── Sync ALL (full push) ──────────────────────  */
  async function syncAllToGitHub() {
    if (!isSyncEnabled()) {
      _toast('GitHub sync is disabled — enable it in Settings', 'warning');
      return;
    }
    const errors = [];
    setSyncStatus('syncing', 'pushing all files…');

    const push = async (label, fn) => { try { await fn(); } catch (e) { errors.push(`${label}: ${e.message}`); } };

    await push('blogs.json',    () => syncBlogsJson('admin: full sync — blogs.json'));
    await push('projects.json', () => syncProjectsJson('admin: full sync — projects.json'));

    for (const b of (window.state?.blogs || [])) {
      const md = localStorage.getItem(`hwh_post_${b.slug}`);
      if (md) await push(`post/${b.slug}`, () => syncBlogMd(b.slug, md));
    }
    for (const p of (window.state?.projects || [])) {
      const md = localStorage.getItem(`hwh_proj_${p.id}`);
      if (md) await push(`project/${p.id}`, () => syncProjectMd(p.id, md));
    }

    if (errors.length) {
      _toast(`Sync done — ${errors.length} error(s). Check sync log.`, 'warning');
      setSyncStatus('error', `${errors.length} error(s)`);
    } else {
      _toast('All files pushed to GitHub ✓', 'success');
      setSyncStatus('ok', 'all synced ✓');
    }
  }

  /* ── Safe toast wrapper ──────────────────────── */
  function _toast(msg, type) {
    if (typeof toast === 'function') toast(msg, type);
    else console.log(`[gh-sync] ${type}: ${msg}`);
  }

  /* ── Patch admin functions ───────────────────── */
  function installPatches() {
    /* saveBlog */
    const _saveBlog = window.saveBlog;
    window.saveBlog = function (idx) {
      // Capture values BEFORE modal closes
      const mdContent = document.getElementById('mbMdTextarea')?.value?.trim() || '';
      const slug      = document.getElementById('mb-slug')?.value?.trim() || '';
      const isNew     = idx === null || idx === undefined;

      _saveBlog.call(this, idx); // local save (closes modal too)

      ;(async () => {
        if (!isSyncEnabled()) return;
        try {
          await syncBlogsJson(`admin: ${isNew ? 'add' : 'update'} blog "${slug}"`);
          if (mdContent && slug) await syncBlogMd(slug, mdContent);
        } catch (e) {
          _toast('GitHub sync failed: ' + e.message, 'error');
        }
      })();
    };

    /* saveProject */
    const _saveProject = window.saveProject;
    window.saveProject = function (idx) {
      const mdContent  = document.getElementById('mpMdTextarea')?.value?.trim() || '';
      const isNew      = idx === null || idx === undefined;
      // For edits: capture current id from state BEFORE the save mutates state
      const existingId = (!isNew && window.state?.projects?.[idx]?.id) || null;

      _saveProject.call(this, idx); // local save

      ;(async () => {
        if (!isSyncEnabled()) return;
        // After save: new projects are prepended (index 0), edits stay at idx
        const savedProj  = isNew ? window.state?.projects?.[0] : window.state?.projects?.[idx];
        const id         = savedProj?.id || existingId;
        if (!id) return;
        try {
          await syncProjectsJson(`admin: ${isNew ? 'add' : 'update'} project "${id}"`);
          if (mdContent) await syncProjectMd(id, mdContent);
        } catch (e) {
          _toast('GitHub sync failed: ' + e.message, 'error');
        }
      })();
    };

    /* deleteBlog */
    const _deleteBlog = window.deleteBlog;
    window.deleteBlog = function (i) {
      const blog = window.state?.blogs?.[i];
      const slug = blog?.slug;
      _deleteBlog.call(this, i);
      ;(async () => {
        if (!isSyncEnabled() || !slug) return;
        try {
          await syncBlogsJson(`admin: delete blog "${slug}"`);
          await ghDelete(`content/posts/${slug}.md`, `admin: delete post "${slug}"`);
        } catch (e) {
          _toast('GitHub sync failed: ' + e.message, 'error');
        }
      })();
    };

    /* deleteProject */
    const _deleteProject = window.deleteProject;
    window.deleteProject = function (i) {
      const proj = window.state?.projects?.[i];
      const id   = proj?.id;
      _deleteProject.call(this, i);
      ;(async () => {
        if (!isSyncEnabled() || !id) return;
        try {
          await syncProjectsJson(`admin: delete project "${id}"`);
          await ghDelete(`content/projects/${id}.md`, `admin: delete project "${id}"`);
        } catch (e) {
          _toast('GitHub sync failed: ' + e.message, 'error');
        }
      })();
    };

    /* toggleBlogPin — metadata change, sync blogs.json */
    const _toggleBlogPin = window.toggleBlogPin;
    window.toggleBlogPin = function (i) {
      _toggleBlogPin.call(this, i);
      ;(async () => {
        if (!isSyncEnabled()) return;
        try { await syncBlogsJson('admin: toggle blog pin'); } catch { /* silent */ }
      })();
    };

    /* toggleProjectPin */
    const _toggleProjectPin = window.toggleProjectPin;
    window.toggleProjectPin = function (i) {
      _toggleProjectPin.call(this, i);
      ;(async () => {
        if (!isSyncEnabled()) return;
        try { await syncProjectsJson('admin: toggle project pin'); } catch { /* silent */ }
      })();
    };

    console.log('[gh-sync] Function patches installed ✓');
  }

  /* ── Inject CSS ──────────────────────────────── */
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ── Sync indicator (topbar) ── */
      .ghs-indicator {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 5px 11px; border-radius: 5px;
        border: 1px solid var(--border-2);
        background: var(--surface-3);
        font-family: var(--ff-mono); font-size: .67rem;
        color: var(--text-3); cursor: default; white-space: nowrap;
        transition: border-color .2s;
        user-select: none;
      }
      .ghs-dot {
        width: 6px; height: 6px; border-radius: 50%;
        flex-shrink: 0; transition: background .3s;
      }
      .ghs-dot.idle    { background: var(--border-3); }
      .ghs-dot.syncing { background: var(--yellow); animation: ghsPulse .7s ease-in-out infinite; }
      .ghs-dot.ok      { background: var(--green); }
      .ghs-dot.error   { background: var(--red); }
      @keyframes ghsPulse { 0%,100%{ opacity:1; } 50%{ opacity:.3; } }

      /* ── Sync log table ── */
      .ghs-log {
        background: var(--surface);
        border: 1px solid var(--border-2);
        border-radius: 8px;
        overflow: hidden;
      }
      .ghs-log-empty {
        padding: 16px 20px;
        font-family: var(--ff-mono); font-size: .68rem; color: var(--text-3);
      }
      .ghs-log-row {
        display: grid;
        grid-template-columns: 52px 44px 1fr auto;
        gap: 10px;
        align-items: center;
        padding: 7px 16px;
        border-bottom: 1px solid var(--border);
        font-family: var(--ff-mono); font-size: .66rem;
      }
      .ghs-log-row:last-child { border-bottom: none; }
      .ghs-log-type {
        padding: 2px 6px; border-radius: 3px;
        font-size: .58rem; text-transform: uppercase; letter-spacing: .07em;
        text-align: center;
      }
      .ghs-log-type.push   { background: rgba(6,214,160,.12); color: #06d6a0; border: 1px solid rgba(6,214,160,.2); }
      .ghs-log-type.delete { background: rgba(255,76,76,.1);  color: #ff4c4c; border: 1px solid rgba(255,76,76,.2); }
      .ghs-log-status.ok      { color: var(--green); }
      .ghs-log-status.error   { color: var(--red); }
      .ghs-log-status.skipped { color: var(--text-3); }
      .ghs-log-path { color: var(--accent); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ghs-log-time { color: var(--text-3); flex-shrink: 0; }

      /* ── Settings badge ── */
      .ghs-badge {
        display: inline-block;
        font-family: var(--ff-mono); font-size: .58rem;
        padding: 1px 7px; border-radius: 10px; letter-spacing: .05em;
        vertical-align: middle; margin-left: 8px;
      }
      .ghs-badge.on  { background: rgba(6,214,160,.1); border: 1px solid rgba(6,214,160,.2); color: #06d6a0; }
      .ghs-badge.off { background: var(--surface-4); border: 1px solid var(--border); color: var(--text-3); }
    `;
    document.head.appendChild(style);
  }

  /* ── Inject topbar controls ──────────────────── */
  function injectTopbar() {
    const topBar = document.getElementById('topBar');
    if (!topBar) return;

    // Sync status indicator
    const indicator = document.createElement('div');
    indicator.className = 'ghs-indicator';
    indicator.title = 'GitHub auto-sync status';
    indicator.innerHTML = `
      <div class="ghs-dot idle"></div>
      <span class="ghs-txt">${isSyncEnabled() ? 'sync on' : 'sync off'}</span>
    `;
    _indicator = indicator;

    // "Push all" button
    const pushBtn = document.createElement('button');
    pushBtn.className = 'tb-btn';
    pushBtn.title = 'Push all local changes to GitHub now';
    pushBtn.innerHTML = '⬆ push all';
    pushBtn.addEventListener('click', syncAllToGitHub);

    // Insert before the first existing tb-btn (export button)
    const firstBtn = topBar.querySelector('.tb-btn');
    topBar.insertBefore(pushBtn,    firstBtn);
    topBar.insertBefore(indicator,  firstBtn);
  }

  /* ── Inject settings group ───────────────────── */
  function injectSettings() {
    const settingsPanel = document.getElementById('sec-settings');
    if (!settingsPanel) return;
    const s = getGhSettings();
    const enabled = isSyncEnabled();

    const group = document.createElement('div');
    group.id = 'ghs-settings';
    group.className = 'settings-group';
    group.innerHTML = `
      <div class="settings-group-title">
        github auto-sync
        <span class="ghs-badge ${enabled ? 'on' : 'off'}" id="ghsBadge">${enabled ? 'enabled' : 'disabled'}</span>
      </div>

      <div class="form-grid single">
        <div class="form-row">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;text-transform:none;font-size:.82rem;color:var(--text-2);">
            <input type="checkbox" id="ghsEnable" ${enabled ? 'checked' : ''}
                   style="accent-color:var(--accent);width:14px;height:14px;"
                   onchange="window.ghSync.toggleEnabled(this.checked)" />
            Enable GitHub auto-sync
          </label>
          <div class="form-hint">When enabled, every blog/project save instantly pushes only the changed file(s) to GitHub. Local save always succeeds first.</div>
        </div>

        <div class="form-row">
          <label>github files api url</label>
          <input type="text" id="ghsApiUrl"
                 value="${s.filesApiUrl || ''}"
                 placeholder="https://your-project.vercel.app/api/github-files" />
          <div class="form-hint">
            Leave blank to auto-derive from your admin API URL (replaces <code style="color:var(--accent)">admin-auth</code> → <code style="color:var(--accent)">github-files</code>).
            Auto-derived URL: <code id="ghsDerivedUrl" style="color:var(--text-2);font-size:.68rem;">${getFilesApiUrl()}</code>
          </div>
        </div>
      </div>

      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <button class="tb-btn accent" onclick="window.ghSync.saveSettings()">save sync settings</button>
        <button class="tb-btn" onclick="window.ghSync.testConnection()">⚡ test connection</button>
        <button class="tb-btn" onclick="window.ghSync.syncAll()">⬆ push all files now</button>
      </div>

      <div style="margin-top:16px;">
        <div style="font-family:var(--ff-mono);font-size:.65rem;color:var(--text-3);margin-bottom:8px;">// sync log (this session)</div>
        <div class="ghs-log" id="ghsSettingsLog">
          <div class="ghs-log-empty">// no syncs yet this session</div>
        </div>
      </div>
    `;

    // Insert before the export/import group (append to settings panel)
    settingsPanel.appendChild(group);
  }

  /* ── Inject dashboard sync panel ─────────────── */
  function injectDashboard() {
    const dashboard = document.getElementById('sec-dashboard');
    if (!dashboard) return;

    // Add "Push to GitHub" quick-action card
    const quickGrid = dashboard.querySelector('.quick-grid');
    if (quickGrid) {
      const card = document.createElement('div');
      card.className = 'quick-card';
      card.onclick   = syncAllToGitHub;
      card.innerHTML = `
        <span class="quick-card-icon">⬆</span>
        <div class="quick-card-text"><strong>Push to GitHub</strong><span>Sync all changes now</span></div>
      `;
      quickGrid.appendChild(card);
    }

    // Sync log section after recent-changes
    const recentEl = document.getElementById('recentChanges');
    if (recentEl && recentEl.parentNode) {
      const section = document.createElement('div');
      section.innerHTML = `
        <div class="section-tag" style="margin-top:28px;margin-bottom:10px;">// github sync log</div>
        <div class="ghs-log" id="ghsDashLog">
          <div class="ghs-log-empty">// no syncs yet this session</div>
        </div>
      `;
      recentEl.parentNode.insertBefore(section, recentEl.nextSibling);
    }
  }

  /* ── Replace blog info banner ─────────────────── */
  function fixBlogInfoBanner() {
    const banners = document.querySelectorAll('#sec-blogs > div[style*="blue"]');
    banners.forEach(el => {
      el.style.cssText = 'background:rgba(6,214,160,.06);border:1px solid rgba(6,214,160,.2);border-radius:6px;padding:12px 16px;margin-bottom:20px;font-size:.78rem;color:#06d6a0;font-family:var(--ff-mono);';
      el.innerHTML = '⬆ GitHub sync is active — saving a blog post automatically pushes <code style="color:var(--accent)">blogs.json</code> and the post <code style="color:var(--accent)">.md</code> to your repo.';
    });
  }

  function fixProjectsInfoBanner() {
    // Optionally add info to the projects section too
    const projSection = document.getElementById('sec-projects');
    if (!projSection) return;
    const hdr = projSection.querySelector('.section-hdr');
    if (!hdr || projSection.querySelector('.ghs-project-info')) return;
    const info = document.createElement('div');
    info.className = 'ghs-project-info';
    info.style.cssText = 'background:rgba(6,214,160,.06);border:1px solid rgba(6,214,160,.2);border-radius:6px;padding:12px 16px;margin-bottom:20px;font-size:.78rem;color:#06d6a0;font-family:var(--ff-mono);';
    info.innerHTML = '⬆ GitHub sync is active — saving a project automatically pushes <code style="color:var(--accent)">projects.json</code> and the project <code style="color:var(--accent)">.md</code> to your repo.';
    hdr.after(info);
  }

  /* ── Render sync log ─────────────────────────── */
  function renderSyncLog() {
    const ids = ['ghsSettingsLog', 'ghsDashLog'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!syncLog.length) {
        el.innerHTML = '<div class="ghs-log-empty">// no syncs yet this session</div>';
        return;
      }
      el.innerHTML = syncLog.slice(0, 12).map(r => `
        <div class="ghs-log-row">
          <span class="ghs-log-type ${r.type}">${r.type}</span>
          <span class="ghs-log-status ${r.status}">${r.status}</span>
          <span class="ghs-log-path" title="${r.path}">${r.path}</span>
          <span class="ghs-log-time">${r.time}</span>
        </div>
      `).join('');
    });
  }

  /* ── Global API (window.ghSync) ──────────────── */
  window.ghSync = {
    push:           ghPush,
    delete:         ghDelete,
    syncBlogs:      syncBlogsJson,
    syncProjects:   syncProjectsJson,
    syncBlogMd,
    syncProjectMd,
    syncAll:        syncAllToGitHub,

    toggleEnabled(checked) {
      const s = getGhSettings();
      s.enabled = checked;
      saveGhSettings(s);
      setSyncStatus('idle', checked ? 'sync on' : 'sync off');
      const badge = document.getElementById('ghsBadge');
      if (badge) { badge.textContent = checked ? 'enabled' : 'disabled'; badge.className = `ghs-badge ${checked ? 'on' : 'off'}`; }
      _toast(`GitHub sync ${checked ? 'enabled ✓' : 'disabled'}`, checked ? 'success' : 'warning');
    },

    saveSettings() {
      const url = document.getElementById('ghsApiUrl')?.value?.trim() || '';
      const s   = getGhSettings();
      s.filesApiUrl = url;
      saveGhSettings(s);
      // Refresh derived URL hint
      const hint = document.getElementById('ghsDerivedUrl');
      if (hint) hint.textContent = getFilesApiUrl();
      _toast('Sync settings saved ✓', 'success');
    },

    async testConnection() {
      setSyncStatus('syncing', 'testing…');
      try {
        const url = getFilesApiUrl();
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ping', token: getAdminToken() }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.status === 404) throw new Error('API not found — check URL in settings');
        if (res.status === 401) throw new Error('Invalid admin token — try logging out and back in');
        if (data.error?.includes('not configured'))
          throw new Error('GITHUB_TOKEN / GITHUB_REPO env vars not set in Vercel');

        setSyncStatus('ok', 'connected ✓');
        _toast(`Connection OK — repo: ${data.repo || '✓'}`, 'success');
      } catch (e) {
        setSyncStatus('error', e.message.slice(0, 40));
        _toast('Connection failed: ' + e.message, 'error');
      }
    },
  };

  /* ── Bootstrap ───────────────────────────────── */
  function init() {
    injectStyles();
    injectTopbar();
    injectSettings();
    injectDashboard();
    fixBlogInfoBanner();
    fixProjectsInfoBanner();
    installPatches();
    console.log(`[gh-sync] v${VERSION} ready — ${isSyncEnabled() ? 'AUTO-SYNC ON' : 'auto-sync off'}`);
  }

  // Boot after DOMContentLoaded + a tick (so admin JS initialises first)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 120));
  } else {
    setTimeout(init, 120);
  }
})();
