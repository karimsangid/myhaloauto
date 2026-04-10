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

  // ---------- Reviews Slider ----------
  // Wrapped in a re-initializable function so reviews.js can call it again
  // after replacing the .review-card content with live Google data.
  let reviewsSliderAbort = null;

  function initReviewsSlider() {
    if (reviewsSliderAbort) reviewsSliderAbort.abort();
    reviewsSliderAbort = new AbortController();
    const { signal } = reviewsSliderAbort;

    const track = document.getElementById('reviewsTrack');
    const prevBtn = document.getElementById('prevReview');
    const nextBtn = document.getElementById('nextReview');
    if (!track || !prevBtn || !nextBtn) return;

    let currentSlide = 0;
    const cards = track.querySelectorAll('.review-card');
    const totalCards = cards.length;
    if (totalCards === 0) return;

    // Reset transform when re-initializing
    track.style.transform = 'translateX(0)';

    function getCardsPerView() {
      if (window.innerWidth <= 768) return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    }

    function updateSlider() {
      const perView = getCardsPerView();
      const maxSlide = Math.max(0, totalCards - perView);
      currentSlide = Math.min(currentSlide, maxSlide);

      const card = cards[0];
      const gap = 24;
      const cardWidth = card.offsetWidth + gap;
      track.style.transform = `translateX(-${currentSlide * cardWidth}px)`;
    }

    prevBtn.addEventListener('click', () => {
      if (currentSlide > 0) {
        currentSlide--;
        updateSlider();
      }
    }, { signal });

    nextBtn.addEventListener('click', () => {
      const perView = getCardsPerView();
      const maxSlide = totalCards - perView;
      if (currentSlide < maxSlide) {
        currentSlide++;
        updateSlider();
      }
    }, { signal });

    window.addEventListener('resize', updateSlider, { signal });

    let autoSlide = setInterval(() => {
      const perView = getCardsPerView();
      const maxSlide = totalCards - perView;
      currentSlide = currentSlide < maxSlide ? currentSlide + 1 : 0;
      updateSlider();
    }, 5000);
    signal.addEventListener('abort', () => clearInterval(autoSlide));

    track.addEventListener('mouseenter', () => clearInterval(autoSlide), { signal });
    track.addEventListener('mouseleave', () => {
      autoSlide = setInterval(() => {
        const perView = getCardsPerView();
        const maxSlide = totalCards - perView;
        currentSlide = currentSlide < maxSlide ? currentSlide + 1 : 0;
        updateSlider();
      }, 5000);
    }, { signal });
  }

  initReviewsSlider();
  // Expose so reviews.js can re-init after swapping in live Google data
  window.__initReviewsSlider = initReviewsSlider;

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

  // ---------- Contact Form (Formspree) ----------
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      btn.disabled = true;

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
          btn.style.background = '#22c55e';
          contactForm.reset();
        } else {
          btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error — Try Again';
          btn.style.background = '#ef4444';
        }
      } catch (err) {
        btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
        btn.style.background = '#22c55e';
        contactForm.reset();
      }

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
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
