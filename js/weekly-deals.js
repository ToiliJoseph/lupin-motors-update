/* ============================================================
   WEEKLY-DEALS.JS — Lupin Motors
   Homepage weekly deals carousel with countdown integration
   ============================================================ */

'use strict';

/* ============================================================
   STATE
   ============================================================ */
const Deals = {
  deals:      [],
  currentIdx: 0,
  visible:    3,      // cards visible at once
  cardWidth:  320,   // base card width + gap
  autoplay:   null
};

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const carousel = document.getElementById('dealsCarousel');
  if (!carousel) return; // Only runs on homepage

  await loadDeals();
  renderDeals();
  bindCarouselEvents();
  startAutoplay();
  renderDots();

 if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}});

/* ============================================================
   LOAD DATA
   ============================================================ */
async function loadDeals() {
  try {
    const res = await fetch('data/weekly-deals.json');
    Deals.deals = await res.json();
  } catch (e) {
    console.error('Failed to load weekly deals', e);
    Deals.deals = [];
  }
}

/* ============================================================
   RENDER DEAL CARDS
   ============================================================ */
function renderDeals() {
  const carousel = document.getElementById('dealsCarousel');
  if (!carousel) return;

  if (Deals.deals.length === 0) {
    carousel.innerHTML = '<p class="text-secondary text-center" style="padding:var(--space-12)">No weekly deals available at this time.</p>';
    return;
  }

  const inner = document.createElement('div');
  inner.className = 'deals-carousel-inner';
  inner.id = 'dealsCarouselInner';

  inner.innerHTML = Deals.deals.map(d => buildDealCard(d)).join('');
  carousel.innerHTML = '';
  carousel.appendChild(inner);

  updateVisibleCount();
  updateCarouselPosition();
}

function buildDealCard(d) {
  const mpg = d.fuelType === 'Electric'
    ? (d.range ? `${d.range}mi` : 'EV')
    : (d.mpgHighway ? `${d.mpgHighway} mpg` : '—');

  return `
    <article class="deal-carousel-card" data-id="${d.vehicleId}">
      <div class="deal-badge-pill">${d.dealBadge || 'Deal'}</div>
      <div class="deal-img-wrap">
        ${d.thumbnail
          ? `<img class="deal-img" src="${d.thumbnail}" alt="${d.year} ${d.make} ${d.model}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'deal-img-placeholder\\'><svg width=\\'48\\' height=\\'48\\' viewBox=\\'0 0 48 48\\' fill=\\'none\\'><rect x=\\'8\\' y=\\'18\\' width=\\'32\\' height=\\'16\\' rx=\\'2\\' stroke=\\'%23c9a84c\\' stroke-width=\\'1.5\\'/><circle cx=\\'16\\' cy=\\'36\\' r=\\'4\\' stroke=\\'%23c9a84c\\' stroke-width=\\'1.5\\'/><circle cx=\\'32\\' cy=\\'36\\' r=\\'4\\' stroke=\\'%23c9a84c\\' stroke-width=\\'1.5\\'/></svg><span>No Image</span></div>'" />`
          : `<div class="deal-img-placeholder"><span>No Image</span></div>`
        }
      </div>
      <div class="deal-card-body">
        <h3 class="deal-card-title">${d.year} ${d.make} ${d.model}</h3>
        <p class="deal-card-trim">${d.trim}</p>
        <div class="deal-card-highlight">
          <i data-lucide="tag" width="12" height="12"></i>
          <span>${d.highlight}</span>
        </div>
        <div class="deal-card-specs">
          <div class="deal-card-spec">
            <span class="deal-card-spec-val">${d.horsepower || '—'} hp</span>
            <span class="deal-card-spec-key">Power</span>
          </div>
          <div class="deal-card-spec">
            <span class="deal-card-spec-val">${d.mileage > 0 ? d.mileage.toLocaleString() + ' mi' : 'Brand New'}</span>
            <span class="deal-card-spec-key">Mileage</span>
          </div>
          <div class="deal-card-spec">
            <span class="deal-card-spec-val">${mpg}</span>
            <span class="deal-card-spec-key">${d.fuelType === 'Electric' ? 'Range' : 'Fuel Econ.'}</span>
          </div>
        </div>
        <div class="deal-card-footer">
          <div class="deal-price-block">
            <span class="deal-price">ksh ${d.dealPrice.toLocaleString()}</span>
            <div class="deal-price-row">            
             
            </div>
            <span class="deal-condition-badge">
              ${d.condition === 'new'
                ? '<span style="color:var(--success)">●</span> Brand New'
                : '<span style="color:var(--gold)">●</span> Pre-Owned'}
            </span>
          </div>
          <a href="vehicle-detail.html?id=${d.vehicleId}" class="btn btn-secondary btn-sm">
            View Details
          </a>
        </div>
      </div>
    </article>
  `;
}

/* ============================================================
   CAROUSEL NAVIGATION
   ============================================================ */
function bindCarouselEvents() {
  document.getElementById('dealsPrev')?.addEventListener('click', () => {
    stopAutoplay();
    goToDeal(Deals.currentIdx - 1);
    startAutoplay();
  });

  document.getElementById('dealsNext')?.addEventListener('click', () => {
    stopAutoplay();
    goToDeal(Deals.currentIdx + 1);
    startAutoplay();
  });

  // Touch swipe
  const carousel = document.getElementById('dealsCarousel');
  let touchStartX = 0;
  carousel?.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  carousel?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      stopAutoplay();
      if (dx < 0) goToDeal(Deals.currentIdx + 1);
      else goToDeal(Deals.currentIdx - 1);
      startAutoplay();
    }
  });
}

function goToDeal(idx) {
  const maxIdx = Math.max(0, Deals.deals.length - Deals.visible);
  Deals.currentIdx = Math.max(0, Math.min(idx, maxIdx));
  updateCarouselPosition();
  updateDots();
}

function updateCarouselPosition() {
  const inner = document.getElementById('dealsCarouselInner');
  if (!inner) return;

  const cardWidth = inner.querySelector('.deal-carousel-card')?.offsetWidth + 24 || 344; // 24px gap
  const offset = Deals.currentIdx * cardWidth;
  inner.style.transform = `translateX(-${offset}px)`;

  // Update button states
  const prev = document.getElementById('dealsPrev');
  const next = document.getElementById('dealsNext');
  const maxIdx = Math.max(0, Deals.deals.length - Deals.visible);
  if (prev) prev.disabled = Deals.currentIdx === 0;
  if (next) next.disabled = Deals.currentIdx >= maxIdx;
}

function updateVisibleCount() {
  const w = window.innerWidth;
  if (w < 640)       Deals.visible = 1;
  else if (w < 1024) Deals.visible = 2;
  else               Deals.visible = 3;

  // Recalculate max index
  const maxIdx = Math.max(0, Deals.deals.length - Deals.visible);
  if (Deals.currentIdx > maxIdx) Deals.currentIdx = maxIdx;

  window.addEventListener('resize', () => {
    const oldVisible = Deals.visible;
    const nw = window.innerWidth;
    if (nw < 640)       Deals.visible = 1;
    else if (nw < 1024) Deals.visible = 2;
    else               Deals.visible = 3;

    if (oldVisible !== Deals.visible) {
      const maxIdx = Math.max(0, Deals.deals.length - Deals.visible);
      if (Deals.currentIdx > maxIdx) Deals.currentIdx = maxIdx;
      updateCarouselPosition();
      renderDots();
    }
  }, { passive: true });
}

/* ============================================================
   DOTS
   ============================================================ */
function renderDots() {
  const wrap = document.getElementById('dealsDots');
  if (!wrap) return;

  const maxIdx = Math.max(0, Deals.deals.length - Deals.visible);
  if (maxIdx <= 0) { wrap.innerHTML = ''; return; }

  wrap.innerHTML = Array.from({ length: maxIdx + 1 }, (_, i) =>
    `<button class="carousel-dot${i === Deals.currentIdx ? ' active' : ''}" data-idx="${i}" aria-label="Go to slide ${i + 1}"></button>`
  ).join('');

  wrap.querySelectorAll('.carousel-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      stopAutoplay();
      goToDeal(parseInt(dot.dataset.idx));
      startAutoplay();
    });
  });
}

function updateDots() {
  document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === Deals.currentIdx);
  });
}

/* ============================================================
   AUTOPLAY
   ============================================================ */
function startAutoplay() {
  stopAutoplay();
  Deals.autoplay = setInterval(() => {
    const maxIdx = Math.max(0, Deals.deals.length - Deals.visible);
    if (Deals.currentIdx >= maxIdx) {
      goToDeal(0); // Loop back to start
    } else {
      goToDeal(Deals.currentIdx + 1);
    }
  }, 5000);
}

function stopAutoplay() {
  if (Deals.autoplay) {
    clearInterval(Deals.autoplay);
    Deals.autoplay = null;
  }
}

// Pause on hover
document.getElementById('dealsCarousel')?.addEventListener('mouseenter', stopAutoplay);
document.getElementById('dealsCarousel')?.addEventListener('mouseleave', startAutoplay);

/* Expose */
window.goToDeal = goToDeal;