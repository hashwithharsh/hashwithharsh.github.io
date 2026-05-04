/* =============================================
   hashwithharsh — theme.js
   Light / Dark theme switch
   • Auto-detects device preference on first visit
   • Persists user choice in localStorage
   • Injects toggle button into existing nav
   ============================================= */

(function () {
  const STORAGE_KEY = 'hwh_theme';

  // ── 1. Resolve theme on first paint (no flash) ──────────────────────────────
  // This runs synchronously before any paint, so there's zero FOUC.
  const saved   = localStorage.getItem(STORAGE_KEY);           // 'light' | 'dark' | null
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved ?? (sysDark ? 'dark' : 'light');

  // Apply immediately so the body never renders with wrong theme
  document.documentElement.setAttribute('data-theme', initial);

  // ── 2. Wait for DOM to inject the toggle button ──────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    injectToggle();
    watchSystemTheme();
  });

  // ── 3. Inject toggle button into the nav ────────────────────────────────────
  function injectToggle() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    // Find the nav container
    const container = nav.querySelector('.container');
    if (!container) return;

    // Find the nav-cta (say hello →) button — we insert the toggle just before it
    const navCta = container.querySelector('.nav-cta');

    const btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.setAttribute('aria-label', 'Toggle light/dark theme');
    btn.setAttribute('data-tooltip', getTooltip());
    btn.innerHTML = getIcon(getCurrentTheme());

    // Insert before the CTA button (or append to container if no CTA)
    if (navCta) {
      container.insertBefore(btn, navCta);
    } else {
      container.appendChild(btn);
    }

    btn.addEventListener('click', toggleTheme);
  }

  // ── 4. Toggle handler ────────────────────────────────────────────────────────
  function toggleTheme() {
    const current = getCurrentTheme();
    const next    = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);   // persist explicit choice
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.innerHTML = getIcon(theme);
      btn.setAttribute('data-tooltip', getTooltip(theme));
    }
  }

  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  // ── 5. React to OS-level changes only if user has NOT made an explicit choice ─
  function watchSystemTheme() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (localStorage.getItem(STORAGE_KEY)) return; // user chose manually → respect it
      applyTheme(e.matches ? 'dark' : 'light');
    });
  }

  // ── 6. Icons & labels ────────────────────────────────────────────────────────
  function getIcon(theme) {
    if (theme === 'light') {
      // Moon icon — clicking will switch to dark
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>`;
    }
    // Sun icon — clicking will switch to light
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"  x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1"  y1="12" x2="3"  y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>`;
  }

  function getTooltip(theme) {
    const t = theme ?? getCurrentTheme();
    return t === 'light' ? 'switch to dark' : 'switch to light';
  }

})();
