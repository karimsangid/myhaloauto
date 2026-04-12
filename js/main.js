/* ============================================
   MY HALO AUTO — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Preloader ----------
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('hidden');
    }, 1200);
  });
  // Fallback: hide preloader after 4 seconds max
  setTimeout(() => preloader.classList.add('hidden'), 4000);

  // ---------- Navbar Scroll ----------
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');

  function handleScroll() {
    const scrollY = window.scrollY;

    if (scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    if (scrollY > 500) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }

    updateActiveNavLink();
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ---------- Back to Top ----------
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------- Mobile Menu ----------
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  const navBackdrop = document.getElementById('navBackdrop');

  function openMobileMenu() {
    hamburger.classList.add('active');
    navMenu.classList.add('active');
    navBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
    navBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    if (navMenu.classList.contains('active')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  navBackdrop.addEventListener('click', closeMobileMenu);

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // ---------- Active Nav Link ----------
  function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id], header[id]');
    const navLinks = document.querySelectorAll('.nav-link:not(.cta-link)');
    let current = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  // ---------- Counter Animation ----------
  function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    counters.forEach(counter => {
      if (counter.dataset.animated) return;

      const target = parseInt(counter.dataset.target);
      const duration = 2000;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = Math.floor(eased * target);

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          counter.textContent = target;
          counter.dataset.animated = 'true';
        }
      }

      requestAnimationFrame(update);
    });
  }

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) statsObserver.observe(heroStats);

  // ---------- Scroll Animations — Staggered ----------
  const animObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // For elements that need stagger, delay based on sibling index
        const el = entry.target;
        const parent = el.parentElement;
        const siblings = parent ? Array.from(parent.children).filter(c => c.classList.contains(el.classList[0])) : [];
        const idx = siblings.indexOf(el);
        const delay = idx * 100; // 100ms stagger

        setTimeout(() => {
          el.classList.add('visible');
        }, delay);

        animObserver.unobserve(el);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  // Observe service cards, why cards, gallery items, contact cards, about features
  document.querySelectorAll('.service-card, .why-card, .gallery-item, .contact-card, .about-feature').forEach(el => {
    animObserver.observe(el);
  });

  // ---------- Section Header Animations ----------
  const headerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        headerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.section-header').forEach(header => {
    headerObserver.observe(header);
  });

  // ---------- About Section Animations ----------
  const aboutObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        aboutObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });

  const aboutImages = document.querySelector('.about-images');
  const aboutContent = document.querySelector('.about-content');
  if (aboutImages) aboutObserver.observe(aboutImages);
  if (aboutContent) aboutObserver.observe(aboutContent);

  // ---------- Gallery Filter ----------
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      let visibleIndex = 0;
      galleryItems.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.classList.remove('hidden');
          item.style.transitionDelay = (visibleIndex * 50) + 'ms';
          // Re-trigger animation
          item.classList.remove('visible');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              item.classList.add('visible');
            });
          });
          visibleIndex++;
        } else {
          item.classList.add('hidden');
          item.style.transitionDelay = '0ms';
        }
      });
    });
  });

  // ---------- Reviews Marquee ----------
  // Pure CSS marquee animation. JS just clones each card once so the loop
  // is seamless. Idempotent — safe to call again after reviews.js swaps in
  // live Google data.
  function setupReviewsMarquee() {
    const track = document.getElementById('reviewsTrack');
    if (!track) return;

    // Remove any existing clones from a previous setup
    track.querySelectorAll('[data-clone]').forEach(el => el.remove());

    // Clone every original card once and append for seamless looping
    const originals = track.querySelectorAll('.review-card');
    if (originals.length === 0) return;
    originals.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('data-clone', 'true');
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  }

  setupReviewsMarquee();
  // Keep the old name exposed so reviews.js (which calls __initReviewsSlider
  // after replacing card content) still works without modification.
  window.__initReviewsSlider = setupReviewsMarquee;
  window.__initReviewsMarquee = setupReviewsMarquee;

  // ---------- FAQ Accordion ----------
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      faqItems.forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      if (!isActive) {
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ---------- Location Autocomplete ----------
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

    function showSuggestions(query) {
      const q = query.toLowerCase().trim();
      locationDropdown.innerHTML = '';
      highlightedIndex = -1;

      if (!q) { locationDropdown.classList.remove('active'); return; }

      const matches = dmvCities.filter(c => c.toLowerCase().includes(q));
      if (matches.length === 0) { locationDropdown.classList.remove('active'); return; }

      matches.forEach((city, i) => {
        const li = document.createElement('li');
        li.textContent = city;
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          locationInput.value = city;
          locationDropdown.classList.remove('active');
        });
        locationDropdown.appendChild(li);
      });
      locationDropdown.classList.add('active');
    }

    locationInput.addEventListener('input', () => showSuggestions(locationInput.value));
    locationInput.addEventListener('focus', () => { if (locationInput.value) showSuggestions(locationInput.value); });
    locationInput.addEventListener('blur', () => { setTimeout(() => locationDropdown.classList.remove('active'), 150); });

    locationInput.addEventListener('keydown', (e) => {
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
        locationDropdown.classList.remove('active');
        return;
      } else { return; }

      items.forEach(li => li.classList.remove('highlighted'));
      items[highlightedIndex].classList.add('highlighted');
      items[highlightedIndex].scrollIntoView({ block: 'nearest' });
    });
  }

  // ---------- Contact Form → SMS to Joseph ----------
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const email = document.getElementById('email').value.trim();
      const vehicle = document.getElementById('vehicle').value.trim();
      const service = document.getElementById('service');
      const serviceText = service.options[service.selectedIndex].text;
      const location = document.getElementById('location').value.trim();
      const message = document.getElementById('message').value.trim();

      let body = `New Quote Request from myhaloauto.com\n\n`;
      body += `Name: ${name}\n`;
      body += `Phone: ${phone}\n`;
      if (email) body += `Email: ${email}\n`;
      body += `Vehicle: ${vehicle}\n`;
      body += `Service: ${serviceText}\n`;
      body += `Location: ${location}\n`;
      if (message) body += `Issue: ${message}\n`;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        window.location.href = `sms:+15719694256?body=${encodeURIComponent(body)}`;
      } else {
        // Desktop fallback — show confirmation with call/text prompt
        const btn = contactForm.querySelector('button[type="submit"]');
        btn.innerHTML = '<i class="fas fa-check"></i> Request Ready!';
        btn.style.background = '#22c55e';
        btn.disabled = true;

        const notice = document.createElement('div');
        notice.style.cssText = 'margin-top:1rem;padding:1.25rem;background:#1a1a2e;border:1px solid var(--primary);border-radius:12px;text-align:center;color:#fff;line-height:1.6;';
        notice.innerHTML = `
          <p style="margin:0 0 0.5rem;font-size:1.1rem;font-weight:600;color:var(--primary);">Almost there!</p>
          <p style="margin:0 0 1rem;">Text or call Joseph to complete your quote request:</p>
          <a href="tel:+15719694256" style="display:inline-block;padding:0.75rem 1.5rem;background:var(--primary);color:#000;border-radius:8px;text-decoration:none;font-weight:600;font-size:1rem;">
            <i class="fas fa-phone-alt"></i> (571) 969-4256
          </a>
          <p style="margin:1rem 0 0;font-size:0.85rem;opacity:0.7;">Mention your name (${name}) and vehicle (${vehicle}) when you call.</p>
        `;
        contactForm.appendChild(notice);
      }
    });
  }

  // ---------- Smooth Scroll for all anchor links ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ---------- Parallax on hero background ----------
  const heroBg = document.querySelector('.hero-bg-img');
  if (heroBg && window.innerWidth > 768) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (scrollY < window.innerHeight) {
        heroBg.style.transform = `scale(1.05) translateY(${scrollY * 0.15}px)`;
      }
    }, { passive: true });
  }

  // ---------- Service icon hover pulse ----------
  document.querySelectorAll('.service-icon').forEach(icon => {
    icon.closest('.service-card').addEventListener('mouseenter', () => {
      icon.style.transform = 'scale(1.15) rotate(5deg)';
      icon.style.background = 'rgba(200,165,78,0.2)';
    });
    icon.closest('.service-card').addEventListener('mouseleave', () => {
      icon.style.transform = '';
      icon.style.background = '';
    });
  });

});
