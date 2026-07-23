
/* ============================================================
   HERO-SLIDER.JS — Lupin Motors
   Homepage hero background image slider with Ken Burns effect
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     HERO BACKGROUND SLIDER
     ============================================================ */
  const HERO_SLIDES = [
    { src: 'images/hero/slide-1.png', alt: 'Luxury Sports Car' },
    { src: 'images/hero/slide-2.jpeg', alt: 'Premium SUV' },
    { src: 'images/hero/slide-3.png', alt: 'Executive Sedan' },
    { src: 'images/hero/slide-4.jpeg', alt: 'High-Performance Coupe' },
    { src: 'images/hero/slide-5.jpeg', alt: 'Luxury Convertible' }
  ];

  const SLIDER_CONFIG = {
    autoplay: true,
    interval: 6000,
    transitionDuration: 1200,
    kenBurns: true,
    pauseOnHover: true
  };

  function initHeroSlider() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    // Create slider container
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'hero-slider';

    // Create slides
    HERO_SLIDES.forEach((slide, index) => {
      const slideEl = document.createElement('div');
      slideEl.className = 'hero-slide' + (index === 0 ? ' active' : '');
      slideEl.style.backgroundImage = `url(${slide.src})`;
      slideEl.setAttribute('role', 'img');
      slideEl.setAttribute('aria-label', slide.alt);
      sliderContainer.appendChild(slideEl);
    });

    // Create overlay for text readability
    const overlay = document.createElement('div');
    overlay.className = 'hero-slider-overlay';
    sliderContainer.appendChild(overlay);

    // Create dots navigation
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'hero-slider-dots';
    dotsContainer.setAttribute('role', 'tablist');
    dotsContainer.setAttribute('aria-label', 'Hero slides');

    HERO_SLIDES.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'hero-slider-dot' + (index === 0 ? ' active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Slide ${index + 1}`);
      dot.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      dot.addEventListener('click', () => goToSlide(index));
      dotsContainer.appendChild(dot);
    });

    sliderContainer.appendChild(dotsContainer);

    // Insert slider before hero content
    const heroContent = heroSection.querySelector('.hero-layout');
    if (heroContent) {
      heroSection.insertBefore(sliderContainer, heroContent);
    } else {
      heroSection.insertBefore(sliderContainer, heroSection.firstChild);
    }

    // State
    let currentSlide = 0;
    let autoplayTimer = null;
    let isPaused = false;

    function goToSlide(index) {
      const slides = sliderContainer.querySelectorAll('.hero-slide');
      const dots = dotsContainer.querySelectorAll('.hero-slider-dot');

      slides[currentSlide].classList.remove('active');
      dots[currentSlide].classList.remove('active');
      dots[currentSlide].setAttribute('aria-selected', 'false');

      currentSlide = index;

      slides[currentSlide].classList.add('active');
      dots[currentSlide].classList.add('active');
      dots[currentSlide].setAttribute('aria-selected', 'true');

      resetAutoplay();
    }

    function nextSlide() {
      const next = (currentSlide + 1) % HERO_SLIDES.length;
      goToSlide(next);
    }

    function prevSlide() {
      const prev = (currentSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
      goToSlide(prev);
    }

    function startAutoplay() {
      if (!SLIDER_CONFIG.autoplay) return;
      stopAutoplay();
      autoplayTimer = setInterval(nextSlide, SLIDER_CONFIG.interval);
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function resetAutoplay() {
      stopAutoplay();
      if (!isPaused) startAutoplay();
    }

    // Keyboard navigation
    heroSection.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    });

    // Pause on hover
    if (SLIDER_CONFIG.pauseOnHover) {
      heroSection.addEventListener('mouseenter', () => {
        isPaused = true;
        stopAutoplay();
      });

      heroSection.addEventListener('mouseleave', () => {
        isPaused = false;
        startAutoplay();
      });
    }

    // Touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    heroSection.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    heroSection.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    }

    // Preload images
    HERO_SLIDES.forEach(slide => {
      const img = new Image();
      img.src = slide.src;
    });

    // Start autoplay
    startAutoplay();

    // Visibility API - pause when tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoplay();
      } else if (!isPaused) {
        startAutoplay();
      }
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    initHeroSlider();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
