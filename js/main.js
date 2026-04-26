/* =============================================
   hashwithharsh — main.js
   Core interactions, animations, nav
   ============================================= */

// ── Nav scroll behavior ──────────────────────
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// ── Mobile menu ──────────────────────────────
const menuBtn    = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenu  = document.getElementById('closeMenu');

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => mobileMenu.classList.add('open'));
  if (closeMenu) closeMenu.addEventListener('click', () => mobileMenu.classList.remove('open'));
}
function closeMobileMenu() {
  if (mobileMenu) mobileMenu.classList.remove('open');
}

// ── Typewriter effect ───────────────────────
const typewriterEl = document.getElementById('typewriter');
if (typewriterEl) {
  const phrases = [
    'whoami --devops-student',
    'kubectl get pods --all',
    'terraform apply --auto-approve',
    'docker build -t hashwithharsh .',
    'cat /etc/passion | grep cloud',
    'git push origin main  # ship it',
  ];
  let phraseIdx = 0, charIdx = 0, deleting = false, pauseCount = 0;

  function typeLoop() {
    const phrase = phrases[phraseIdx];

    if (!deleting) {
      typewriterEl.textContent = phrase.substring(0, charIdx + 1);
      charIdx++;
      if (charIdx === phrase.length) {
        deleting = true;
        setTimeout(typeLoop, 1800);
        return;
      }
      setTimeout(typeLoop, 55 + Math.random() * 25);
    } else {
      typewriterEl.textContent = phrase.substring(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        setTimeout(typeLoop, 400);
        return;
      }
      setTimeout(typeLoop, 28);
    }
  }
  setTimeout(typeLoop, 900);
}

// ── Hero name stagger reveal ─────────────────
window.addEventListener('load', () => {
  const line1 = document.querySelector('.hero-name .line1');
  const line2 = document.querySelector('.hero-name .line2');
  const heroDesc = document.querySelector('.hero-desc');
  const heroCtas = document.querySelector('.hero-ctas');
  const heroStatus = document.querySelector('.hero-status');

  // Animate the whole hero-name h1, NOT individual spans (line1/line2).
  // Animating child spans leaves the parent h1 block in normal flow at full
  // size — its rendered glyphs bleed outside the box and block the buttons.
  const heroName = document.querySelector('.hero-name');
  const els = [heroStatus, heroName, heroDesc, heroCtas].filter(Boolean);

  // Set initial hidden state first
  els.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
  });

  // Double rAF: ensures browser paints opacity:0 before transition fires.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      els.forEach((el, i) => {
        el.style.transition = `opacity .7s cubic-bezier(.23,1,.32,1) ${i * .12 + .1}s, transform .7s cubic-bezier(.23,1,.32,1) ${i * .12 + .1}s`;
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    });
  });
});

// ── Intersection Observer (reveal on scroll) ─
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Counter animation ────────────────────────
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const box = entry.target;
    const target = parseInt(box.dataset.target, 10);
    const span = box.querySelector('span');
    if (!span || !target) return;

    const duration = 1400;
    const start = performance.now();

    function animateCount(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      span.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(animateCount);
      else span.textContent = target;
    }
    requestAnimationFrame(animateCount);
    counterObserver.unobserve(box);
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-num[data-target]').forEach(el => counterObserver.observe(el));

// ── Ticker builder ───────────────────────────
function buildTicker(items) {
  const track = document.getElementById('ticker');
  if (!track) return;
  // Duplicate for seamless loop
  const all = [...items, ...items];
  track.innerHTML = all.map(item =>
    `<div class="ticker-item"><span>${item}</span><div class="ticker-dot"></div></div>`
  ).join('');
}

// ── Contact form ─────────────────────────────
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const success = document.getElementById('form-success');
    const error = document.getElementById('form-error');

    btn.textContent = 'sending...';
    btn.disabled = true;
    success.style.display = 'none';
    error.style.display = 'none';

    const data = {
      name:    form.name.value,
      email:   form.email.value,
      subject: form.subject.value,
      message: form.message.value,
    };

    try {
      // Replace with your actual Vercel API URL after deployment
      const CONTACT_API = 'https://hashwithharsh-api.vercel.app/api/contact';
      const res = await fetch(CONTACT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        success.style.display = 'block';
        form.reset();
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      error.style.display = 'block';
    } finally {
      btn.textContent = 'send it →';
      btn.disabled = false;
    }
  });
}

// ── Back to top ──────────────────────────────
(function () {
  const btn = document.createElement('button');
  btn.id = 'backToTop';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '↑';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

// ── Copy-code buttons ─────────────────────────
function addCopyButtons() {
  document.querySelectorAll('.post-body pre').forEach(pre => {
    if (pre.querySelector('.copy-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'copy';
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code');
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.innerText);
        btn.textContent = 'copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('copied'); }, 2000);
      } catch { btn.textContent = 'failed'; }
    });
    pre.appendChild(btn);
  });
}

// ── Post TOC ─────────────────────────────────
function buildTOC() {
  const body = document.getElementById('postBody');
  if (!body) return;
  const headings = body.querySelectorAll('h2, h3');
  if (headings.length < 3) return;

  const toc = document.createElement('nav');
  toc.className = 'post-toc';
  toc.innerHTML = '<div class="post-toc-title">on this page</div>';

  headings.forEach((h, i) => {
    const id = 'heading-' + i;
    h.id = id;
    const a = document.createElement('a');
    a.href = '#' + id;
    a.textContent = h.textContent;
    if (h.tagName === 'H3') a.style.paddingLeft = '24px';
    toc.appendChild(a);
  });

  document.body.appendChild(toc);

  // Highlight active heading
  const tocLinks = toc.querySelectorAll('a');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        tocLinks.forEach(l => l.classList.remove('active'));
        const link = toc.querySelector(`a[href="#${entry.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { rootMargin: '-80px 0px -60% 0px' });
  headings.forEach(h => observer.observe(h));
}

// ── Blog search ───────────────────────────────
function initBlogSearch(blogs, containerId) {
  const wrap = document.querySelector('.search-wrap');
  const input = document.getElementById('blogSearch');
  if (!input || !wrap) return;

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    const filtered = q
      ? blogs.filter(b =>
          b.title.toLowerCase().includes(q) ||
          b.excerpt.toLowerCase().includes(q) ||
          b.tags.some(t => t.toLowerCase().includes(q))
        )
      : blogs;
    renderBlogItems(filtered, containerId);
  });
}

// ── Page transitions ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('section, .page-hero, .post-header');
  if (main) main.classList.add('page-fade-in');

  // Intercept internal links for smooth transitions
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto')) return;
    link.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      // Let the browser handle it normally — GitHub Pages has no SPA router
    });
  });
});

// Ensure mobile menu never blocks clicks
document.addEventListener("click", (e) => {
  const menu = document.getElementById("mobileMenu");
  if (!menu) return;

  if (menu.classList.contains("open") && !menu.contains(e.target)) {
    menu.classList.remove("open");
  }
});
