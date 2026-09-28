/* ============================================================
   MAIN.JS — Lupin Motors
   Navbar, scroll, back-to-top, particles, testimonials,
   countdown timer, brands strip, hero search
   ============================================================ */

'use strict';

/* ============================================================
   1. DOM READY
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}
  initNavbar();
  initHeroParticles();
  initHeroSearch();
  initCountdown();
  initTestimonials();
  initBackToTop();
  initScrollProgress();
  initScrollAnimations();
  initCategoryCount();
});

/* ============================================================
   2. NAVBAR
   ============================================================ */
function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!navbar) return;

  // Initial state: transparent over hero
  const hasHero = document.querySelector('.hero');
  if (hasHero) {
    navbar.classList.add('navbar-transparent');
  } else {
    navbar.classList.add('navbar-scrolled');
  }

  // Scroll handler
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Solid state
    if (scrollY > 80) {
      navbar.classList.remove('navbar-transparent');
      navbar.classList.add('navbar-scrolled');
    } else if (hasHero) {
      navbar.classList.add('navbar-transparent');
      navbar.classList.remove('navbar-scrolled');
    }

    lastScroll = scrollY;
  }, { passive: true });

  // Mobile hamburger toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      mobileMenu.setAttribute('aria-hidden', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close mobile menu on link click
    mobileMenu.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (
        mobileMenu.classList.contains('active') &&
        !mobileMenu.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        closeMobileMenu();
      }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        closeMobileMenu();
      }
    });
  }

  function closeMobileMenu() {
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Highlight active nav link
  highlightActiveLink();
}

function highlightActiveLink() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    const href = link.getAttribute('href')?.split('?')[0];
    if (href === current || (current === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* ============================================================
   3. SCROLL PROGRESS BAR
   ============================================================ */
function initScrollProgress() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  // Create progress bar element
  const bar = document.createElement('div');
  bar.className = 'navbar-progress';
  navbar.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrollTop  = document.documentElement.scrollTop;
    const scrollH    = document.documentElement.scrollHeight - window.innerHeight;
    const pct        = scrollH > 0 ? (scrollTop / scrollH) * 100 : 0;
    bar.style.width  = pct + '%';
  }, { passive: true });
}

/* ============================================================
   4. HERO PARTICLES
   ============================================================ */
function initHeroParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;

  const count = window.innerWidth < 768 ? 18 : 35;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';

    const size   = Math.random() * 3 + 1;
    const left   = Math.random() * 100;
    const delay  = Math.random() * 12;
    const dur    = Math.random() * 10 + 8;
    const bottom = Math.random() * 40;

    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      bottom: ${bottom}%;
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
    `;

    container.appendChild(p);
  }
}

/* ============================================================
   5. HERO SEARCH
   ============================================================ */
function handleHeroSearch() {
  const make  = document.getElementById('heroMake')?.value  || '';
  const type  = document.getElementById('heroType')?.value  || '';
  const price = document.getElementById('heroPrice')?.value || '';

  const params = new URLSearchParams();
  if (make)  params.set('make', make);
  if (type)  params.set('type', type);
  if (price) params.set('maxPrice', price);

  window.location.href = `inventory.html${params.toString() ? '?' + params.toString() : ''}`;
}

function initHeroSearch() {
  const btn = document.getElementById('heroSearchBtn');
  if (btn) {
    // Also trigger on Enter key in any select
    ['heroMake', 'heroType', 'heroPrice'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleHeroSearch();
      });
    });
  }
}

/* ============================================================
   6. COUNTDOWN TIMER (Weekly Deals)
   ============================================================ */
function initCountdown() {
  const cdDays  = document.getElementById('cdDays');
  const cdHours = document.getElementById('cdHours');
  const cdMins  = document.getElementById('cdMins');
  const cdSecs  = document.getElementById('cdSecs');
  if (!cdDays) return;

  // Calculate next Sunday midnight
  function getNextSunday() {
    const now  = new Date();
    const day  = now.getDay();         // 0 = Sun
    const diff = day === 0 ? 7 : (7 - day);
    const next = new Date(now);
    next.setDate(now.getDate() + diff);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now  = new Date();
    const end  = getNextSunday();
    const diff = Math.max(0, end - now);

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000)  / 60000);
    const s = Math.floor((diff % 60000)    / 1000);

    cdDays.textContent  = pad(d);
    cdHours.textContent = pad(h);
    cdMins.textContent  = pad(m);
    cdSecs.textContent  = pad(s);
  }

  tick();
  setInterval(tick, 1000);
}

/* ============================================================
   7. TESTIMONIALS SLIDER
   ============================================================ */
const TESTIMONIALS = [
  {
    text: "Lupin made buying my first luxury car an absolute pleasure. No pressure, transparent pricing, and an incredible selection. I drove away in my dream BMW the same day!",
    name: "Marcus Thompson",
    meta: "Purchased BMW 5 Series",
    initials: "MT",
    rating: 5
  },
  {
    text: "The trade-in process was seamless and they gave me fair market value for my old car. The team was professional and knowledgeable. Highly recommend Lupin to anyone.",
    name: "Sarah Williams",
    meta: "Purchased Mercedes GLE",
    initials: "SW",
    rating: 5
  },
  {
    text: "Got approved for financing in under 20 minutes! The interest rate was better than my bank offered. The whole experience from browsing online to driving home took just 3 hours.",
    name: "David Chen",
    meta: "Purchased Audi Q7",
    initials: "DC",
    rating: 5
  },
  {
    text: "I've bought three cars from Lupin over the years and each time the service gets better. Their certified pre-owned program gives real peace of mind. Won't shop anywhere else.",
    name: "Jennifer Rodriguez",
    meta: "Purchased Toyota Land Cruiser",
    initials: "JR",
    rating: 5
  },
  {
    text: "The online search made it so easy to narrow down exactly what I wanted. When I arrived, the car was exactly as described. No hidden fees, no surprises. Perfect transaction.",
    name: "Michael Foster",
    meta: "Purchased Porsche Cayenne",
    initials: "MF",
    rating: 5
  },
  {
    text: "Their after-sales service is exceptional. Even months after purchasing, the team follows up and helps with any concerns. That's the kind of dealership loyalty that keeps customers for life.",
    name: "Amelia Johnson",
    meta: "Purchased Lexus RX 350",
    initials: "AJ",
    rating: 5
  }
];

function initTestimonials() {
  const track = document.getElementById('testimonialsTrack');
  const tDots = document.getElementById('tDots');
  const tPrev = document.getElementById('tPrev');
  const tNext = document.getElementById('tNext');
  if (!track) return;

  // Render cards
  track.innerHTML = TESTIMONIALS.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-quote">"</div>
      <p class="testimonial-text">${t.text}</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${t.initials}</div>
        <div>
          <div class="testimonial-name">${t.name}</div>
          <div class="testimonial-meta">${t.meta}</div>
        </div>
        <div class="stars" style="margin-left:auto">
          ${'★'.repeat(t.rating)}
        </div>
      </div>
    </div>
  `).join('');

  // Calculate visible count
  function getVisible() {
    if (window.innerWidth < 640)  return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }

  let current  = 0;
  let visible  = getVisible();
  const total  = TESTIMONIALS.length;

  function maxIndex() { return Math.max(0, total - visible); }

  // Render dots
  function renderDots() {
    if (!tDots) return;
    const pages = maxIndex() + 1;
    tDots.innerHTML = Array.from({ length: pages }, (_, i) =>
      `<div class="t-dot ${i === current ? 'active' : ''}" data-i="${i}"></div>`
    ).join('');
    tDots.querySelectorAll('.t-dot').forEach(d => {
      d.addEventListener('click', () => goTo(parseInt(d.dataset.i)));
    });
  }

  function goTo(index) {
    current = Math.max(0, Math.min(index, maxIndex()));
    const cardW    = track.querySelector('.testimonial-card')?.offsetWidth || 0;
    const gap      = 24; // var(--space-6)
    const offset   = current * (cardW + gap);
    track.style.transform = `translateX(-${offset}px)`;
    renderDots();
  }

  tPrev?.addEventListener('click', () => goTo(current - 1));
  tNext?.addEventListener('click', () => goTo(current + 1));

  // Auto-rotate every 5s
  let autoPlay = setInterval(() => goTo(current + 1 > maxIndex() ? 0 : current + 1), 5000);
  track.addEventListener('mouseenter', () => clearInterval(autoPlay));
  track.addEventListener('mouseleave', () => {
    autoPlay = setInterval(() => goTo(current + 1 > maxIndex() ? 0 : current + 1), 5000);
  });

  // Recalculate on resize
  window.addEventListener('resize', () => {
    visible = getVisible();
    current = Math.min(current, maxIndex());
    goTo(current);
    renderDots();
  }, { passive: true });

  renderDots();
}

/* ============================================================
   8. BACK TO TOP
   ============================================================ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   9. SCROLL ANIMATIONS (Intersection Observer)
   ============================================================ */
function initScrollAnimations() {
  const elements = document.querySelectorAll('[data-animate]');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el    = entry.target;
        const type  = el.dataset.animate;
        const delay = parseInt(el.dataset.delay || '0');

        setTimeout(() => {
          el.classList.add('animated', `anim-${type}`);
        }, delay);

        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* ============================================================
   10. CATEGORY COUNTS (simulated from data)
   ============================================================ */
async function initCategoryCount() {
  const counts = {
    suv:         248,
    sedan:       312,
    truck:       185,
    coupe:       143,
    electric:     98,
    convertible:  67
  };

  document.querySelectorAll('.category-count[data-type]').forEach(el => {
    const type = el.dataset.type;
    if (counts[type] !== undefined) {
      el.textContent = `${counts[type]} vehicles`;
    }
  });
}

/* ============================================================
   11. TOAST HELPER (global utility)
   ============================================================ */
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: 'check-circle',
    error:   'x-circle',
    warning: 'alert-triangle',
    info:    'info'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i data-lucide="${icons[type] || 'info'}" width="18" height="18"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  lucide.createIcons({ nodes: [toast] });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ============================================================
   12. SMOOTH SCROLL FOR ANCHOR LINKS
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 90; // navbar height
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ============================================================
   13. EXPOSE GLOBALS
   ============================================================ */
window.handleHeroSearch = handleHeroSearch;
window.showToast        = showToast;