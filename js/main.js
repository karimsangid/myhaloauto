/* ============================================
   MY HALO AUTO: Main JavaScript (v8)
   Runs on every page; every query is null-guarded.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  root.classList.add('js');

  const body = document.body;
  const isHome = body.classList.contains('home');
  const mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const reducedMotion = !!(mqReduce && mqReduce.matches);
  let motionOff = reducedMotion; // updated live if the OS setting changes
  const ICON = (name) => `<svg class="ico" aria-hidden="true" focusable="false"><use href="/images/icons.svg#i-${name}"></use></svg>`;

  // ---------- Colour shift ----------
  // The page colour follows the scroll. As the edge between two blocks travels
  // through the middle of the screen, the colour blends from one block's colour
  // to the next (mixed in linear light), so it changes as gradually as you scroll.
  // Text tone flips where ink and chalk text have equal contrast.
  (function colourShift() {
    // The footer is a fixed forest plinth (styles.css) and is not a shift stop: when it
    // reaches mid-screen the page keeps the colour of the last block above it, so the
    // bottom of every page does not turn dark.
    const secs = Array.from(document.querySelectorAll('[data-bg]')).filter(s => !s.closest('footer'));
    if (!secs.length) return;
    const HEX  = { paper: '#F4EEE3', sand: '#E3C99A', sage: '#BFCCB2', brass: '#E2CB8A', gold: '#C8A54E', green: '#1F3B31', forest: '#152A22' };
    const TONE = { paper: 'light', sand: 'light', sage: 'light', brass: 'light', gold: 'gold', green: 'deep', forest: 'deep' };
    const meta = document.querySelector('meta[name="theme-color"]');
    const LUM_SWITCH = 0.184;            // ink #1C1A16 and chalk #F4EEE3 have equal contrast here
    const LUM_LO = 0.15, LUM_HI = 0.224; // between these neither text colour reaches 4.5:1, so the blend never rests there
    let active = false, raf = 0, lastBg = '', lastTone = '';

    const toLin = (hex) => [1, 3, 5].map(i => { const v = parseInt(hex.substr(i, 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    const toHex = (lin) => '#' + lin.map(v => { v = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0'); }).join('');
    const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    const LIN = {}; Object.keys(HEX).forEach(k => { LIN[k] = toLin(HEX[k]); });
    const key = (el) => (HEX[el.getAttribute('data-bg')] ? el.getAttribute('data-bg') : 'paper');
    const smooth = (p) => p * p * (3 - 2 * p);

    // Which two colours are on screen, and how far the blend between them has got.
    function blendState() {
      const mid = window.innerHeight / 2;
      const D = Math.max(window.innerHeight * 0.6, 280); // scroll distance one blend takes
      const rs = secs.map(s => s.getBoundingClientRect());
      let i = -1;
      for (let k = 0; k < rs.length; k++) if (rs[k].top <= mid) i = k;
      if (i < 0) return { a: key(secs[0]), b: key(secs[0]), p: 0 };
      if (i > 0) { // finishing the blend into block i
        const s0 = rs[i - 1].bottom - D / 2, e0 = rs[i].top + D / 2;
        if (mid < e0) return { a: key(secs[i - 1]), b: key(secs[i]), p: (mid - s0) / (e0 - s0) };
      }
      if (i + 1 < rs.length) { // starting the blend into block i + 1
        const s1 = rs[i].bottom - D / 2, e1 = rs[i + 1].top + D / 2;
        if (mid > s1) return { a: key(secs[i]), b: key(secs[i + 1]), p: (mid - s1) / (e1 - s1) };
      }
      return { a: key(secs[i]), b: key(secs[i]), p: 0 };
    }

    function update() {
      raf = 0;
      const st = blendState();
      const p = st.a === st.b ? 0 : smooth(Math.min(1, Math.max(0, st.p)));
      const A = LIN[st.a], B = LIN[st.b];
      const La = lum(A), Lb = lum(B);
      let q = p, L = La + (Lb - La) * p; // luminance is linear in p when mixing in linear light
      if (L > LUM_LO && L < LUM_HI && La !== Lb) { // jump across the low-contrast band
        const edge = (L - LUM_LO) < (LUM_HI - L) ? LUM_LO : LUM_HI;
        q = (edge - La) / (Lb - La); L = edge;
      }
      const bg = toHex(A.map((v, n) => v + (B[n] - v) * q));
      const ta = TONE[st.a], tb = TONE[st.b];
      let tone;
      if (ta === tb) tone = ta;
      else if (ta === 'deep' || tb === 'deep') tone = L < LUM_SWITCH ? 'deep' : (ta === 'deep' ? tb : ta);
      else tone = q < 0.5 ? ta : tb;
      if (bg !== lastBg) { lastBg = bg; root.style.setProperty('--page-bg', bg); if (meta) meta.setAttribute('content', bg); }
      if (tone !== lastTone) { lastTone = tone; root.setAttribute('data-tone', tone); }
    }
    const schedule = () => { if (active && !raf) raf = requestAnimationFrame(update); };

    function on() {
      if (mqReduce && mqReduce.matches) return; // static mode: each block paints itself
      active = true;
      update(); // correct colour on first paint, incl. /#contact loads
      root.classList.add('shift');
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule, { passive: true });
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('shift-ready'))); // no fade on load
    }
    function off() {
      active = false; cancelAnimationFrame(raf); raf = 0; lastBg = ''; lastTone = '';
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      root.classList.remove('shift', 'shift-ready'); root.removeAttribute('data-tone');
      root.style.removeProperty('--page-bg'); if (meta) meta.setAttribute('content', HEX.paper);
    }
    on();
    if (mqReduce && mqReduce.addEventListener) mqReduce.addEventListener('change', () => { off(); on(); });
    // after a hash jump the browser scrolls after DOMContentLoaded; re-sync once
    window.addEventListener('load', schedule, { once: true });
  })();

  // ---------- Current year ----------
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });

  // ---------- Open / closed status (published hours only) ----------
  (function openStatus() {
    const els = document.querySelectorAll('[data-open-status]');
    if (!els.length) return;
    let wd, h;
    try {
      const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      wd = p.find(x => x.type === 'weekday').value; h = parseInt(p.find(x => x.type === 'hour').value, 10);
    } catch (e) { return; }
    let text, state = 'closed';
    if (wd === 'Sun') text = 'Sunday by request · Mon–Sat 7AM–7PM';
    else if (h >= 7 && h < 19) { text = 'Mon–Sat 7AM–7PM'; state = 'open'; }
    else text = 'Outside regular hours (Mon–Sat 7AM–7PM). We typically respond within 12 hours during business hours.';
    els.forEach(el => { el.textContent = text; el.setAttribute('data-state', state); el.hidden = false; });
  })();

  // ---------- Reveal on scroll ----------
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if (motionOff || !('IntersectionObserver' in window)) {
      revealEls.forEach(el => el.classList.add('is-visible'));
    } else {
      // Headings hide themselves with clip-path, which makes them report as not
      // intersecting; for those, watch the parent block instead.
      const watch = new Map();
      revealEls.forEach(el => {
        const t = el.tagName === 'H2' && el.parentElement ? el.parentElement : el;
        if (!watch.has(t)) watch.set(t, []);
        watch.get(t).push(el);
      });
      const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (watch.get(entry.target) || []).forEach(el => el.classList.add('is-visible'));
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
      watch.forEach((els, t) => revealObserver.observe(t));
    }
  }

  // ---------- Video (hero + work loop) ----------
  (function videos() {
    const vids = Array.from(document.querySelectorAll('.vid video[data-src]'));
    if (!vids.length) return;
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const slowNet = !!(conn && (conn.saveData === true || /(^|-)2g$|^3g$/.test(conn.effectiveType || '')));
    const lessData = !!(window.matchMedia && window.matchMedia('(prefers-reduced-data: reduce)').matches);
    const allowed = !motionOff && !slowNet && !lessData && ('IntersectionObserver' in window);
    const small = !!(window.matchMedia && window.matchMedia('(max-width: 899px)').matches);
    let pageLoaded = document.readyState === 'complete';

    vids.forEach(v => {
      const wrap = v.closest('.vid');
      const toggle = wrap ? wrap.querySelector('.vid__toggle') : null;
      if (!allowed) { if (wrap) wrap.classList.add('vid--still'); return; }
      let userPaused = false, inView = false;

      function setBtn(playing) {
        if (!toggle) return;
        toggle.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
        toggle.setAttribute('aria-pressed', playing ? 'false' : 'true');
        toggle.innerHTML = ICON(playing ? 'pause' : 'play');
      }
      function load() {
        if (v.getAttribute('src')) return;
        v.src = (small && v.dataset.srcSm) ? v.dataset.srcSm : v.dataset.src;
        v.load();
      }
      function tryPlay() {
        // waits for window load so the video never competes with fonts and the poster
        if (userPaused || !inView || document.hidden || motionOff || !pageLoaded) return;
        load();
        const p = v.play();
        if (p && p.catch) p.catch(() => setBtn(false));
      }
      v.addEventListener('play', () => setBtn(true));
      v.addEventListener('pause', () => setBtn(false));

      new IntersectionObserver(entries => {
        entries.forEach(e => {
          inView = e.isIntersecting && e.intersectionRatio >= 0.25;
          if (inView) tryPlay(); else if (!v.paused) v.pause();
        });
      }, { threshold: [0, 0.25, 0.5] }).observe(wrap || v);

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { if (!v.paused) v.pause(); } else tryPlay();
      });
      if (!pageLoaded) window.addEventListener('load', () => { pageLoaded = true; tryPlay(); }, { once: true });

      if (toggle) toggle.addEventListener('click', () => {
        if (v.paused) { userPaused = false; inView = true; tryPlay(); }
        else { userPaused = true; v.pause(); }
      });
    });
  })();

  // ---------- Reduced motion switched on while the page is open ----------
  if (mqReduce && mqReduce.addEventListener) {
    mqReduce.addEventListener('change', (e) => {
      motionOff = e.matches;
      if (!e.matches) return;
      document.querySelectorAll('.vid video').forEach(v => {
        v.pause();
        const w = v.closest('.vid'); if (w) w.classList.add('vid--still');
      });
      document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-visible'));
    });
  }

  // ---------- Text links on computers: sms: does nothing there, so go to the quote form ----------
  (function smsOnDesktop() {
    const mobileUA = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const finePointer = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
    if (mobileUA || !finePointer) return;
    const form = document.getElementById('contactForm');
    const formSec = form ? form.closest('section[id]') : null;
    const quote = document.querySelector('.action-bar__btn--quote');
    const target = formSec ? '#' + formSec.id : (quote ? quote.getAttribute('href') : '/#contact');
    document.querySelectorAll('a[href^="sms:"]').forEach(a => {
      a.setAttribute('href', target);
      a.setAttribute('data-sms-desktop', '');
    });
  })();

  // ---------- Navbar scroll state + back to top ----------
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');
  const homeSections = isHome ? Array.from(document.querySelectorAll('section[id], header[id]')) : [];
  const homeNavLinks = isHome
    ? Array.from(document.querySelectorAll('.nav-link:not(.cta-link)')).filter(a => {
        try {
          const u = new URL(a.href, location.href);
          return u.pathname === '/' && u.hash.length > 1;
        } catch (err) { return false; }
      })
    : [];

  function updateActiveNavLink() {
    if (!homeNavLinks.length) return;
    let current = '';
    const y = window.scrollY + 140;
    homeSections.forEach(section => {
      if (y >= section.offsetTop) current = section.id;
    });
    homeNavLinks.forEach(link => {
      const hash = new URL(link.href, location.href).hash;
      link.classList.toggle('active', !!current && hash === '#' + current);
    });
  }

  let ticking = false;
  function handleScroll() {
    ticking = false;
    const y = window.scrollY;
    if (navbar) navbar.classList.toggle('scrolled', y >= 24);
    if (backToTop) backToTop.classList.toggle('visible', y > 600);
    updateActiveNavLink();
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(handleScroll);
    }
  }, { passive: true });
  handleScroll();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: motionOff ? 'auto' : 'smooth' });
    });
  }

  // ---------- Mobile menu ----------
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  const navBackdrop = document.getElementById('navBackdrop');

  function isMenuOpen() {
    return !!(navMenu && navMenu.classList.contains('active'));
  }

  // While the drawer is open, everything outside the navbar is inert so Tab
  // cannot reach page content hidden behind the drawer and backdrop.
  function setPageInert(on) {
    Array.from(document.body.children).forEach(el => {
      if (el === navbar || el.tagName === 'SCRIPT') return;
      if (on) {
        if (!el.inert) { el.inert = true; el.setAttribute('data-nav-inert', ''); }
      } else if (el.hasAttribute('data-nav-inert')) {
        el.inert = false; el.removeAttribute('data-nav-inert');
      }
    });
  }

  function openMobileMenu() {
    if (!hamburger || !navMenu) return;
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Close menu');
    navMenu.classList.add('active');
    if (navBackdrop) navBackdrop.classList.add('active');
    if (navbar) navbar.classList.add('menu-open');
    body.classList.add('nav-open');
    setPageInert(true);
    const first = navMenu.querySelector('a');
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 60);
  }

  function closeMobileMenu(returnFocus) {
    if (!hamburger || !navMenu) return;
    const wasOpen = isMenuOpen();
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open menu');
    navMenu.classList.remove('active');
    if (navBackdrop) navBackdrop.classList.remove('active');
    if (navbar) navbar.classList.remove('menu-open');
    body.classList.remove('nav-open');
    setPageInert(false);
    if (wasOpen && returnFocus) hamburger.focus({ preventScroll: true });
  }

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      if (isMenuOpen()) closeMobileMenu(true);
      else openMobileMenu();
    });
    if (navBackdrop) navBackdrop.addEventListener('click', () => closeMobileMenu(true));
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => closeMobileMenu(false));
    });
    document.addEventListener('keydown', (e) => {
      if (!isMenuOpen()) return;
      if (e.key === 'Escape') { closeMobileMenu(true); return; }
      // Fallback focus wrap (browsers without inert): menu links <-> hamburger
      if (e.key === 'Tab') {
        const links = Array.from(navMenu.querySelectorAll('a'));
        if (!links.length) return;
        const firstLink = links[0];
        if (e.shiftKey && document.activeElement === firstLink) { e.preventDefault(); hamburger.focus(); }
        else if (!e.shiftKey && document.activeElement === hamburger) { e.preventDefault(); firstLink.focus(); }
      }
    });
    // Close the drawer if the viewport grows past the drawer breakpoint
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1180 && isMenuOpen()) closeMobileMenu(false);
    });
  }

  // ---------- Smooth scroll for in-page links (home: also "/#x") ----------
  function hashTarget(hash) {
    if (!hash || hash === '#') return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); }
    catch (err) { return null; }
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    let hash = '';
    if (href.charAt(0) === '#') {
      hash = href;
    } else if (isHome && href.indexOf('/#') === 0) {
      hash = href.slice(1);
    } else {
      return;
    }
    const target = hashTarget(hash);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: motionOff ? 'auto' : 'smooth', block: 'start' });
    try { history.replaceState(null, '', hash); } catch (err) { /* ignore */ }
    if (a.classList.contains('skip-link')) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  // ---------- Service preselect from ?service= + company field ----------
  const serviceSelect = document.getElementById('service');
  const companyGroup = document.querySelector('[data-company-group]');
  function syncCompany() {
    if (!companyGroup || companyGroup.getAttribute('data-company-group') === 'always') return;
    companyGroup.hidden = !(serviceSelect && serviceSelect.value === 'fleet');
  }
  if (serviceSelect) {
    let wanted = null;
    try { wanted = new URLSearchParams(location.search).get('service'); } catch (err) { wanted = null; }
    if (wanted) {
      const opt = Array.from(serviceSelect.options).find(o => o.value === wanted);
      if (opt) serviceSelect.value = wanted;
    }
    serviceSelect.addEventListener('change', syncCompany);
  }
  syncCompany();

  // ---------- Services index: photo panel follows the hovered/focused row ----------
  (function servicesIndex() {
    const list = document.querySelector('[data-index]');
    const panel = document.querySelector('.index__frame');
    if (!list || !panel) return;
    const imgs = Array.from(panel.querySelectorAll('img'));
    const tag = document.querySelector('[data-panel-tag]');
    const rows = Array.from(list.querySelectorAll('.index__row'));
    let active = 0;
    function setActive(i) {
      if (i === active || !imgs[i]) return;
      imgs.forEach(img => img.classList.remove('was-active'));
      if (imgs[active]) { imgs[active].classList.remove('is-active'); imgs[active].classList.add('was-active'); }
      imgs[i].classList.add('is-active');
      rows.forEach((r, n) => r.classList.toggle('is-active', n === i));
      if (tag) tag.textContent = imgs[i].getAttribute('data-name') || '';
      active = i;
    }
    rows.forEach((row, i) => {
      row.addEventListener('mouseenter', () => setActive(i));
      row.addEventListener('focus', () => setActive(i));
    });
  })();

  // ---------- Reviews: phones show 3, then "Show 3 more" ----------
  (function reviewsMore() {
    const section = document.getElementById('reviews');
    const btn = section ? section.querySelector('.reviews__more') : null;
    if (!section || !btn) return;
    section.classList.add('reviews--collapsed');
    btn.addEventListener('click', () => {
      section.classList.remove('reviews--collapsed');
      btn.setAttribute('aria-expanded', 'true');
      btn.hidden = true;
      const fourth = section.querySelectorAll('.review-card')[3];
      if (fourth) { fourth.setAttribute('tabindex', '-1'); fourth.focus({ preventScroll: true }); }
    });
  })();
  // reviews.js (dormant) calls this after swapping in live data; nothing to rebuild now.
  window.__initReviewsSlider = function () {};
  window.__initReviewsMarquee = window.__initReviewsSlider;

  // ---------- Gallery: phones show 6, then "Show all 12 photos" ----------
  (function galleryMore() {
    const section = document.getElementById('gallery');
    const btn = section ? section.querySelector('.gallery__more') : null;
    if (!section || !btn) return;
    section.classList.add('gallery--collapsed');
    btn.addEventListener('click', () => {
      section.classList.remove('gallery--collapsed');
      btn.setAttribute('aria-expanded', 'true');
      btn.hidden = true;
      const seventh = section.querySelectorAll('.sheet-grid figure')[6];
      if (seventh) {
        section.querySelectorAll('.sheet-grid figure').forEach(f => f.classList.add('is-visible'));
        seventh.setAttribute('tabindex', '-1'); seventh.focus({ preventScroll: true });
      }
    });
  })();

  // ---------- Map: tap to load (desktop also loads when it scrolls into view) ----------
  document.querySelectorAll('.map-tap[data-map-src]').forEach(panel => {
    let done = false;
    function load() {
      if (done) return; done = true;
      const f = document.createElement('iframe');
      f.src = panel.getAttribute('data-map-src');
      f.title = panel.getAttribute('data-map-title') || 'Service area map';
      f.loading = 'lazy';
      f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      f.setAttribute('allowfullscreen', '');
      panel.appendChild(f);
      panel.classList.add('is-loaded');
    }
    const btn = panel.querySelector('button');
    if (btn) btn.addEventListener('click', () => { load(); });
    if (window.matchMedia && window.matchMedia('(min-width: 1024px)').matches && 'IntersectionObserver' in window) {
      const mio = new IntersectionObserver((entries, obs) => {
        if (entries.some(e => e.isIntersecting)) { load(); obs.disconnect(); }
      }, { rootMargin: '200px 0px' });
      mio.observe(panel);
    }
  });

  // ---------- "At a glance" starts closed below 1024px ----------
  if (window.matchMedia && !window.matchMedia('(min-width: 1024px)').matches) {
    document.querySelectorAll('details.spec-wrap[open]').forEach(d => d.removeAttribute('open'));
  }

  // ---------- FAQ accordion (single open) ----------
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => {
        i.classList.remove('active');
        const q = i.querySelector('.faq-question');
        if (q) q.setAttribute('aria-expanded', 'false');
      });
      if (!isActive) {
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ---------- Sticky bar hides while a form field has focus ----------
  const actionBar = document.querySelector('.action-bar');
  if (actionBar) {
    const isField = (el) => !!(el && el.matches && el.matches('input, select, textarea'));
    document.addEventListener('focusin', (e) => { if (isField(e.target)) actionBar.classList.add('action-bar--hidden'); });
    document.addEventListener('focusout', () => {
      setTimeout(() => { if (!isField(document.activeElement)) actionBar.classList.remove('action-bar--hidden'); }, 60);
    });
  }

  // ---------- Location autocomplete ----------
  const dmvCities = [
    'Alexandria, VA','Annandale, VA','Arlington, VA','Ashburn, VA',
    'Bethesda, MD','Bowie, MD','Burke, VA',
    'Centreville, VA','Chantilly, VA','Cheverly, MD','College Park, MD','Columbia, MD',
    'Dale City, VA','Dumfries, VA',
    'Fairfax, VA','Falls Church, VA','Fort Washington, MD','Frederick, MD','Fredericksburg, VA',
    'Gainesville, VA','Germantown, MD','Glen Burnie, MD','Greenbelt, MD',
    'Haymarket, VA','Herndon, VA','Hyattsville, MD',
    'Kensington, MD',
    'Lake Ridge, VA','Landover, MD','Largo, MD','Laurel, MD','Leesburg, VA','Lorton, VA',
    'Manassas, VA','McLean, VA','Merrifield, VA',
    'Oakton, VA','Occoquan, VA',
    'Potomac, MD','Prince Frederick, MD',
    'Reston, VA','Rockville, MD','Rosslyn, VA',
    'Silver Spring, MD','Springfield, VA','Stafford, VA','Sterling, VA','Suitland, MD',
    'Takoma Park, MD','Tysons, VA',
    'Upper Marlboro, MD',
    'Vienna, VA',
    'Washington, DC','Woodbridge, VA','Woodlawn, VA',
    'Other'
  ];

  const locationInput = document.getElementById('location');
  const locationDropdown = document.getElementById('locationDropdown');

  if (locationInput && locationDropdown) {
    let highlightedIndex = -1;

    function hideSuggestions() {
      locationDropdown.classList.remove('active');
      locationDropdown.innerHTML = '';
      highlightedIndex = -1;
      locationInput.setAttribute('aria-expanded', 'false');
      locationInput.removeAttribute('aria-activedescendant');
    }

    function showSuggestions(query) {
      const q = query.toLowerCase().trim();
      locationDropdown.innerHTML = '';
      highlightedIndex = -1;
      locationInput.removeAttribute('aria-activedescendant');

      if (!q) { hideSuggestions(); return; }

      const matches = dmvCities.filter(c => c.toLowerCase().includes(q));
      if (matches.length === 0) { hideSuggestions(); return; }

      matches.forEach((city, i) => {
        const li = document.createElement('li');
        li.textContent = city;
        li.id = 'loc-opt-' + i;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          locationInput.value = city;
          hideSuggestions();
        });
        locationDropdown.appendChild(li);
      });
      locationDropdown.classList.add('active');
      locationInput.setAttribute('aria-expanded', 'true');
    }

    locationInput.addEventListener('input', () => showSuggestions(locationInput.value));
    locationInput.addEventListener('focus', () => { if (locationInput.value) showSuggestions(locationInput.value); });
    locationInput.addEventListener('blur', () => { setTimeout(hideSuggestions, 150); });

    locationInput.addEventListener('keydown', (e) => {
      if (!locationDropdown.classList.contains('active')) return;
      const items = locationDropdown.querySelectorAll('li');
      if (!items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightedIndex = Math.max(highlightedIndex - 1, 0);
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault();
        locationInput.value = items[highlightedIndex].textContent;
        hideSuggestions();
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        hideSuggestions();
        return;
      } else { return; }

      items.forEach(li => { li.classList.remove('highlighted'); li.setAttribute('aria-selected', 'false'); });
      items[highlightedIndex].classList.add('highlighted');
      items[highlightedIndex].setAttribute('aria-selected', 'true');
      locationInput.setAttribute('aria-activedescendant', items[highlightedIndex].id);
      items[highlightedIndex].scrollIntoView({ block: 'nearest' });
    });
  }

  // ---------- Contact form -> SMS to the technician ----------
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
    const val = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const submitLabel = submitBtn ? submitBtn.querySelector('.btn__label') : null;
    const helpLine = contactForm.querySelector('.form-help');
    if (!isMobile) {
      if (submitLabel) submitLabel.textContent = 'Prepare my request';
      if (helpLine) helpLine.textContent = "On a computer, you'll get the message to copy or email.";
    }

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = val('name');
      const phone = val('phone');
      const email = val('email');
      const company = val('company');
      const vehicle = val('vehicle');
      const service = document.getElementById('service');
      const serviceText = service && service.selectedIndex >= 0 ? service.options[service.selectedIndex].text : '';
      const location = val('location');
      const message = val('message');

      let smsBody = `New Quote Request from myhaloauto.com\n\n`;
      smsBody += `Name: ${name}\n`;
      if (company) smsBody += `Company: ${company}\n`;
      if (phone) smsBody += `Phone: ${phone}\n`;
      if (email) smsBody += `Email: ${email}\n`;
      smsBody += `Vehicle: ${vehicle}\n`;
      smsBody += `Service: ${serviceText}\n`;
      smsBody += `Location: ${location}\n`;
      if (message) smsBody += `Issue: ${message}\n`;

      const old = contactForm.querySelector('.form-notice');
      if (old) old.remove();
      const notice = document.createElement('div');
      notice.className = 'form-notice';
      notice.setAttribute('role', 'status');

      if (isMobile) {
        const href = `sms:+15719694256?body=${encodeURIComponent(smsBody)}`;
        window.__mhaLastSmsHref = href;
        window.location.href = href;
        notice.innerHTML = `
          <p class="form-notice__title">Almost there!</p>
          <p class="form-notice__text">Didn't open? Call or text (571) 969-4256.</p>
          <a href="tel:+15719694256" class="btn btn--call">${ICON('phone')} Call (571) 969-4256</a>
        `;
        contactForm.appendChild(notice);
        return;
      }

      // Desktop: confirmation with the composed message to copy or email
      if (submitBtn) {
        submitBtn.innerHTML = `${ICON('check')} Request Ready!`;
        submitBtn.classList.add('is-ready');
        submitBtn.disabled = true;
      }
      const mailto = `mailto:myhaloauto@gmail.com?subject=Quote%20request&body=${encodeURIComponent(smsBody)}`;
      notice.innerHTML = `
        <p class="form-notice__title">Almost there!</p>
        <p class="form-notice__text">Text or call Joseph to complete your quote request:</p>
        <a href="tel:+15719694256" class="btn btn--call">${ICON('phone')} (571) 969-4256</a>
        <p class="form-notice__small">Mention your name (${escapeHtml(name)}) and vehicle (${escapeHtml(vehicle)}) when you call.</p>
        <label class="visually-hidden" for="formNoticeMsg">Your request</label>
        <textarea class="form-notice__msg" id="formNoticeMsg" rows="7" readonly>${escapeHtml(smsBody)}</textarea>
        <div class="btn-row">
          <button type="button" class="btn btn--line" data-copy>${ICON('copy')} <span>Copy message</span></button>
          <a class="btn btn--line" href="${mailto}">${ICON('mail')} Email it</a>
        </div>
      `;
      contactForm.appendChild(notice);
      const copyBtn = notice.querySelector('[data-copy]');
      const msgBox = notice.querySelector('.form-notice__msg');
      if (copyBtn && msgBox) {
        copyBtn.addEventListener('click', () => {
          const label = copyBtn.querySelector('span');
          const done = () => { if (label) { label.textContent = 'Copied'; setTimeout(() => { label.textContent = 'Copy message'; }, 2000); } };
          const fallback = () => { msgBox.focus(); msgBox.select(); try { if (document.execCommand('copy')) done(); } catch (err) { /* selected for manual copy */ } };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(smsBody).then(done, fallback);
          else fallback();
        });
      }
    });
  }
});
