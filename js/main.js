/* ============================================
   MY HALO AUTO: Main JavaScript (v6)
   Runs on every page; every query is null-guarded.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  root.classList.add('js');

  const body = document.body;
  const isHome = body.classList.contains('home');
  const reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ---------- Current year ----------
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });

  // ---------- Reveal on scroll ----------
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(el => el.classList.add('is-visible'));
    } else {
      const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(el => revealObserver.observe(el));
    }
  }

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
    if (navbar) navbar.classList.toggle('scrolled', y >= 60);
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
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
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
    const navbar = document.getElementById('navbar');
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
    // Close the drawer if the viewport grows past the mobile breakpoint
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1180 && isMenuOpen()) closeMobileMenu(false);
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
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    try { history.replaceState(null, '', hash); } catch (err) { /* ignore */ }
    if (a.classList.contains('skip-link')) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  // ---------- Service preselect from ?service= ----------
  const serviceSelect = document.getElementById('service');
  if (serviceSelect) {
    let wanted = null;
    try { wanted = new URLSearchParams(location.search).get('service'); } catch (err) { wanted = null; }
    if (wanted) {
      const opt = Array.from(serviceSelect.options).find(o => o.value === wanted);
      if (opt) serviceSelect.value = wanted;
    }
  }

  // ---------- Gallery filter ----------
  const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
  const galleryGrid = document.querySelector('.gallery-grid');
  const galleryItems = document.querySelectorAll('.gallery-item[data-category]');
  if (filterBtns.length && galleryItems.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        filterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        if (galleryGrid) galleryGrid.setAttribute('data-filter', filter);
        galleryItems.forEach(item => {
          const show = filter === 'all' || item.dataset.category === filter;
          item.classList.toggle('hidden', !show);
          if (show) item.classList.add('is-visible');
        });
      });
    });
  }

  // ---------- Reviews marquee ----------
  // Pure CSS marquee. JS clones each card once so the loop is seamless.
  // Idempotent: safe to call again after reviews.js swaps in live data.
  function setupReviewsMarquee() {
    const track = document.getElementById('reviewsTrack');
    if (!track) return;
    track.querySelectorAll('[data-clone]').forEach(el => el.remove());
    const originals = track.querySelectorAll('.review-card');
    if (originals.length === 0) return;
    originals.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('data-clone', 'true');
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a, button').forEach(el => el.setAttribute('tabindex', '-1'));
      track.appendChild(clone);
    });
  }
  setupReviewsMarquee();

  const reviewsSlider = document.getElementById('reviewsSlider');
  const reviewsToggle = document.getElementById('reviewsToggle');
  if (reviewsSlider && reviewsToggle) {
    reviewsToggle.addEventListener('click', () => {
      const paused = reviewsSlider.classList.toggle('is-paused');
      reviewsToggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
      reviewsToggle.textContent = paused ? 'Play reviews' : 'Pause reviews';
    });
  }
  // reviews.js calls __initReviewsSlider after replacing card content.
  window.__initReviewsSlider = setupReviewsMarquee;
  window.__initReviewsMarquee = setupReviewsMarquee;

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
      smsBody += `Phone: ${phone}\n`;
      if (email) smsBody += `Email: ${email}\n`;
      smsBody += `Vehicle: ${vehicle}\n`;
      smsBody += `Service: ${serviceText}\n`;
      smsBody += `Location: ${location}\n`;
      if (message) smsBody += `Issue: ${message}\n`;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        const href = `sms:+15719694256?body=${encodeURIComponent(smsBody)}`;
        window.__mhaLastSmsHref = href;
        window.location.href = href;
      } else {
        // Desktop fallback: confirmation with a call/text prompt
        const btn = contactForm.querySelector('button[type="submit"]');
        if (btn) {
          btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Request Ready!';
          btn.classList.add('is-ready');
          btn.disabled = true;
        }

        const old = contactForm.querySelector('.form-notice');
        if (old) old.remove();

        const notice = document.createElement('div');
        notice.className = 'form-notice';
        notice.setAttribute('role', 'status');
        notice.innerHTML = `
          <p class="form-notice__title">Almost there!</p>
          <p class="form-notice__text">Text or call Joseph to complete your quote request:</p>
          <a href="tel:+15719694256" class="btn btn-primary"><i class="fas fa-phone-alt" aria-hidden="true"></i> (571) 969-4256</a>
          <p class="form-notice__small">Mention your name (${escapeHtml(name)}) and vehicle (${escapeHtml(vehicle)}) when you call.</p>
        `;
        contactForm.appendChild(notice);
      }
    });
  }
});
