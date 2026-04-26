/* ===================================================
   hashwithharsh — admin-trigger.js
   Secret admin access system:
   • Type "harsh" anywhere on the page → login modal
   • Navigate to /admin.html → full admin panel
   =================================================== */

(function () {
  const SESSION_KEY  = 'hwh_admin_session';
  const AUTH_API     = 'https://hashwithharsh-api.vercel.app/api/admin-auth';
  const ADMIN_PAGE   = 'admin.html';
  const SECRET       = 'harsh';

  // ── Auth helpers ─────────────────────────────────
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
  }
  function isAuthed() {
    const s = getSession();
    return s && s.expiry > Date.now();
  }
  function saveSession(token, expiry) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, expiry }));
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  // ── Root path helper ─────────────────────────────
  function adminPath() {
    // Handle subdirectory (e.g. /posts/post.html → go up)
    const depth = (window.location.pathname.match(/\//g) || []).length - 1;
    return '../'.repeat(depth) + ADMIN_PAGE;
  }

  // ── Login API call ───────────────────────────────
  async function doLogin(password) {
    try {
      const res = await fetch(AUTH_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password, action: 'login' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      return data;
    } catch (err) {
      throw err;
    }
  }

  // ── Inject modal HTML ─────────────────────────────
  function injectModal() {
    if (document.getElementById('hwhAdminModal')) return;

    const style = document.createElement('style');
    style.textContent = `
      #hwhAdminModal {
        position: fixed; inset: 0; z-index: 999999;
        display: flex; align-items: center; justify-content: center;
        background: rgba(7,7,7,.92);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        opacity: 0; transition: opacity .25s ease;
        font-family: 'JetBrains Mono', 'Courier New', monospace;
      }
      #hwhAdminModal.visible { opacity: 1; }
      #hwhAdminBox {
        background: #0d0d0d;
        border: 1px solid #252525;
        border-radius: 10px;
        padding: 40px;
        width: 100%;
        max-width: 400px;
        margin: 20px;
        transform: translateY(16px) scale(.97);
        transition: transform .3s cubic-bezier(.23,1,.32,1);
      }
      #hwhAdminModal.visible #hwhAdminBox { transform: none; }
      .hwh-admin-tag {
        display: inline-flex; align-items: center; gap: 8px;
        font-size: .7rem; color: #b5ff4d; letter-spacing: .1em;
        text-transform: uppercase; margin-bottom: 24px;
      }
      .hwh-admin-tag::before { content: ''; width: 18px; height: 1px; background: #b5ff4d; }
      #hwhAdminBox h2 {
        font-family: 'Syne', 'Outfit', sans-serif;
        font-size: 1.5rem; font-weight: 700; color: #e2e2e2;
        letter-spacing: -.02em; margin-bottom: 8px;
      }
      #hwhAdminBox p {
        font-size: .8rem; color: #666; margin-bottom: 32px; line-height: 1.5;
      }
      .hwh-field label {
        display: block; font-size: .68rem; color: #b5ff4d; letter-spacing: .08em;
        text-transform: uppercase; margin-bottom: 8px;
      }
      .hwh-field input {
        width: 100%; background: #131313; border: 1px solid #252525;
        border-radius: 6px; padding: 12px 14px; color: #e2e2e2;
        font-family: 'JetBrains Mono', monospace; font-size: .85rem;
        outline: none; transition: border-color .2s, box-shadow .2s;
        letter-spacing: .05em;
      }
      .hwh-field input:focus {
        border-color: rgba(181,255,77,.5);
        box-shadow: 0 0 0 3px rgba(181,255,77,.07);
      }
      .hwh-field input::placeholder { color: #444; }
      #hwhLoginBtn {
        width: 100%; margin-top: 20px;
        background: #b5ff4d; color: #0a0a0a;
        border: none; border-radius: 6px; padding: 13px;
        font-family: 'JetBrains Mono', monospace; font-size: .82rem;
        font-weight: 600; letter-spacing: .06em; cursor: pointer;
        transition: background .2s, transform .15s, box-shadow .2s;
      }
      #hwhLoginBtn:hover {
        background: #c9ff6a;
        box-shadow: 0 0 24px rgba(181,255,77,.25);
      }
      #hwhLoginBtn:active { transform: scale(.98); }
      #hwhLoginBtn:disabled { opacity: .5; cursor: not-allowed; }
      #hwhLoginError {
        display: none; margin-top: 14px;
        font-size: .78rem; color: #ff4c4c;
        text-align: center; letter-spacing: .03em;
      }
      #hwhLoginError.show { display: block; }
      #hwhModalClose {
        position: absolute; top: 16px; right: 20px;
        background: none; border: none; color: #444;
        font-size: 1.1rem; cursor: pointer;
        font-family: 'JetBrains Mono', monospace;
        padding: 4px 8px; border-radius: 4px;
        transition: color .2s;
      }
      #hwhModalClose:hover { color: #e2e2e2; }
      .hwh-spinner {
        display: inline-block; width: 12px; height: 12px;
        border: 2px solid #0a0a0a; border-top-color: transparent;
        border-radius: 50%; animation: hwhSpin .6s linear infinite;
        margin-right: 8px; vertical-align: middle;
      }
      @keyframes hwhSpin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

    const modal = document.createElement('div');
    modal.id = 'hwhAdminModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Admin Login');
    modal.innerHTML = `
      <div id="hwhAdminBox">
        <button id="hwhModalClose" aria-label="Close">✕</button>
        <div class="hwh-admin-tag">// admin access</div>
        <h2>Enter the vault.</h2>
        <p>Password protected — enter credentials to access the admin panel.</p>
        <div class="hwh-field">
          <label for="hwhPasswordInput">password</label>
          <input type="password" id="hwhPasswordInput" placeholder="••••••••••••" autocomplete="current-password" />
        </div>
        <button id="hwhLoginBtn">authenticate →</button>
        <div id="hwhLoginError">⚠ Invalid password. Try again.</div>
      </div>
    `;
    document.body.appendChild(modal);

    // Bind events
    document.getElementById('hwhModalClose').addEventListener('click', hideModal);
    modal.addEventListener('click', e => { if (e.target === modal) hideModal(); });
    document.getElementById('hwhPasswordInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') attemptLogin();
    });
    document.getElementById('hwhLoginBtn').addEventListener('click', attemptLogin);
  }

  function showModal() {
    injectModal();
    const modal = document.getElementById('hwhAdminModal');
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('visible'));
    setTimeout(() => document.getElementById('hwhPasswordInput')?.focus(), 300);
  }

  function hideModal() {
    const modal = document.getElementById('hwhAdminModal');
    if (!modal) return;
    modal.classList.remove('visible');
    setTimeout(() => { modal.style.display = 'none'; }, 250);
  }

  async function attemptLogin() {
    const input  = document.getElementById('hwhPasswordInput');
    const btn    = document.getElementById('hwhLoginBtn');
    const errEl  = document.getElementById('hwhLoginError');
    const pw     = input?.value?.trim();

    if (!pw) { input?.focus(); return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="hwh-spinner"></span>verifying...';
    errEl.classList.remove('show');

    try {
      const data = await doLogin(pw);
      saveSession(data.token, data.expiry);
      btn.innerHTML = '✓ authenticated!';
      btn.style.background = '#b5ff4d';
      setTimeout(() => {
        window.location.href = adminPath();
      }, 600);
    } catch (err) {
      errEl.textContent = '⚠ ' + (err.message || 'Login failed');
      errEl.classList.add('show');
      btn.disabled = false;
      btn.innerHTML = 'authenticate →';
      input.value = '';
      input.focus();
    }
  }

  // ── Secret keypress listener ─────────────────────
  let keyBuffer = '';
  let keyTimer  = null;

  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    keyBuffer += e.key.toLowerCase();
    clearTimeout(keyTimer);
    keyTimer = setTimeout(() => { keyBuffer = ''; }, 1500);

    if (keyBuffer.includes(SECRET)) {
      keyBuffer = '';
      clearTimeout(keyTimer);
      if (isAuthed()) {
        window.location.href = adminPath();
      } else {
        showModal();
      }
    }
  });

  // ── Expose globally for inline usage ─────────────
  window.hwhAdmin = { show: showModal, hide: hideModal, isAuthed, clearSession };
})();
