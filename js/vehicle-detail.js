/* ============================================================
   VEHICLE-DETAIL.JS — Lupin Motors
   Gallery, specs, tabs, modals, calculator, similar vehicles
   ============================================================ */

'use strict';

/* ============================================================
   STATE
   ============================================================ */
const Detail = {
  vehicle:    null,
  allVehicles:[],
  galleryIdx:  0,
  lbIdx:       0
};

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const id = getParam('id');
  if (!id) { showError(); return; }

  await loadAllVehicles();
  const v = Detail.allVehicles.find(x => x.id === id);

  if (!v) { showError(); return; }

  Detail.vehicle = v;
  renderPage(v);
  bindTabEvents();
  bindGalleryEvents();
  bindModalEvents();
  bindCalculator();
  bindActionButtons();
  renderSimilar();

  // Init icons after render
  if (window.lucide) lucide.createIcons();
});

/* ============================================================
   LOAD DATA
   ============================================================ */
async function loadAllVehicles() {
  try {
    const res = await fetch('data/vehicles.json');
    Detail.allVehicles = await res.json();
  } catch(e) {
    Detail.allVehicles = [];
  }
}

/* ============================================================
   RENDER PAGE
   ============================================================ */
function renderPage(v) {
  hideLoading();

  // Page title
  document.title = `${v.year} ${v.make} ${v.model} | Lupin Motors`;

  // Meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = `${v.year} ${v.make} ${v.model} ${v.trim} — ksh ${v.price.toLocaleString()}. ${v.description?.substring(0,120)}…`;

  // Breadcrumb
  setText('breadcrumbTitle', `${v.year} ${v.make} ${v.model}`);

  // Render all sections
  renderGallery(v);
  renderVehicleHeader(v);
  renderOverviewTab(v);
  renderSpecsTab(v);
  renderFeaturesTab(v);
  renderSafetyTab(v);
  renderCalculator(v);
  showContent();
}

/* ============================================================
   GALLERY
   ============================================================ */
function renderGallery(v) {
  const images = (v.images && v.images.length > 0) ? v.images : (v.thumbnail ? [v.thumbnail] : []);
  Detail.galleryImages = images;
  Detail.galleryIdx    = 0;

  renderMainImage(0);
  renderThumbs(images);
  updateGalleryCounter();
}

function renderMainImage(idx) {
  const wrap = document.getElementById('galleryMainImgWrap');
  if (!wrap) return;
  const v    = Detail.vehicle;
  const imgs = Detail.galleryImages;

  if (imgs.length === 0) {
    wrap.innerHTML = `
      <div class="gallery-main-placeholder">
        <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
          <path d="M10 45h60M12 45l10-22h36l10 22" stroke="#c9a84c" stroke-width="2" stroke-linecap="round"/>
          <rect x="22" y="20" width="22" height="14" rx="1" stroke="#c9a84c" stroke-width="1.5"/>
          <circle cx="22" cy="47" r="7" stroke="#c9a84c" stroke-width="2"/>
          <circle cx="58" cy="47" r="7" stroke="#c9a84c" stroke-width="2"/>
        </svg>
        <span>Photos Coming Soon</span>
      </div>`;
    return;
  }

  wrap.innerHTML = `<img class="gallery-main-img" src="${imgs[idx]}" alt="${v.year} ${v.make} ${v.model} — Photo ${idx+1}" loading="eager" onerror="this.src=''; this.parentElement.innerHTML='<div class=gallery-main-placeholder><span>Image unavailable</span></div>'" />`;

  // Update active thumb
  document.querySelectorAll('.gallery-thumb').forEach((t,i) => {
    t.classList.toggle('active', i === idx);
  });

  Detail.galleryIdx = idx;
  updateGalleryCounter();
}

function renderThumbs(images) {
  const wrap = document.getElementById('galleryThumbs');
  if (!wrap) return;

  if (images.length <= 1) { wrap.style.display = 'none'; return; }

  wrap.innerHTML = images.map((src, i) => `
    <div class="gallery-thumb${i === 0 ? ' active' : ''}" data-idx="${i}" role="button" tabindex="0" aria-label="Photo ${i+1}">
      <img src="${src}" alt="Photo ${i+1}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=gallery-thumb-placeholder>${i+1}</div>'" />
    </div>
  `).join('');

  wrap.querySelectorAll('.gallery-thumb').forEach(t => {
    t.addEventListener('click', () => renderMainImage(parseInt(t.dataset.idx)));
    t.addEventListener('keydown', e => {
      if (e.key === 'Enter') renderMainImage(parseInt(t.dataset.idx));
    });
  });
}

function updateGalleryCounter() {
  const el    = document.getElementById('galleryCounter');
  const total = (Detail.galleryImages || []).length;
  if (el) el.textContent = total > 0 ? `${Detail.galleryIdx + 1} / ${total}` : '';
  if (el) el.style.display = total > 0 ? '' : 'none';

  const prev = document.getElementById('galleryPrev');
  const next = document.getElementById('galleryNext');
  if (prev) prev.disabled = Detail.galleryIdx === 0;
  if (next) next.disabled = Detail.galleryIdx >= total - 1;
}

function bindGalleryEvents() {
  document.getElementById('galleryPrev')?.addEventListener('click', () => {
    if (Detail.galleryIdx > 0) renderMainImage(Detail.galleryIdx - 1);
  });
  document.getElementById('galleryNext')?.addEventListener('click', () => {
    if (Detail.galleryIdx < Detail.galleryImages.length - 1) renderMainImage(Detail.galleryIdx + 1);
  });

  // Fullscreen → lightbox
  document.getElementById('galleryFullscreenBtn')?.addEventListener('click', () => openLightbox(Detail.galleryIdx));
  document.getElementById('galleryMainImgWrap')?.addEventListener('click', () => {
    if (Detail.galleryImages.length > 0) openLightbox(Detail.galleryIdx);
  });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (document.getElementById('lightbox')?.classList.contains('active')) return;
    if (e.key === 'ArrowLeft') document.getElementById('galleryPrev')?.click();
    if (e.key === 'ArrowRight') document.getElementById('galleryNext')?.click();
  });

  // Touch swipe support
  let touchStartX = 0;
  const main = document.getElementById('galleryMain');
  main?.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  main?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx < 0) document.getElementById('galleryNext')?.click();
      else document.getElementById('galleryPrev')?.click();
    }
  });
}

/* ============================================================
   LIGHTBOX
   ============================================================ */
function openLightbox(idx) {
  const lb = document.getElementById('lightbox');
  if (!lb || !Detail.galleryImages.length) return;
  Detail.lbIdx = idx;
  renderLightboxImage(idx);
  lb.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox')?.classList.remove('active');
  document.body.style.overflow = '';
}

function renderLightboxImage(idx) {
  const img     = document.getElementById('lightboxImg');
  const counter = document.getElementById('lightboxCounter');
  const prev    = document.getElementById('lightboxPrev');
  const next    = document.getElementById('lightboxNext');
  const total   = Detail.galleryImages.length;

  Detail.lbIdx = idx;
  if (img)     img.src          = Detail.galleryImages[idx];
  if (counter) counter.textContent = `${idx + 1} / ${total}`;
  if (prev)    prev.disabled    = idx === 0;
  if (next)    next.disabled    = idx >= total - 1;
}

document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
document.getElementById('lightboxOverlay')?.addEventListener('click', closeLightbox);
document.getElementById('lightboxPrev')?.addEventListener('click', () => {
  if (Detail.lbIdx > 0) renderLightboxImage(Detail.lbIdx - 1);
});
document.getElementById('lightboxNext')?.addEventListener('click', () => {
  if (Detail.lbIdx < Detail.galleryImages?.length - 1) renderLightboxImage(Detail.lbIdx + 1);
});
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox')?.classList.contains('active')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  document.getElementById('lightboxPrev')?.click();
  if (e.key === 'ArrowRight') document.getElementById('lightboxNext')?.click();
});

/* ============================================================
   VEHICLE HEADER
   ============================================================ */
function renderVehicleHeader(v) {
  // Badges
  const badgeWrap = document.getElementById('vehicleHeaderBadges');
  if (badgeWrap) {
    badgeWrap.innerHTML = [
      v.condition === 'new' ? '<span class="badge badge-new">Brand New</span>' : '<span class="badge badge-used">Pre-Owned</span>',
      v.weeklyDeal  ? '<span class="badge badge-deal">Weekly Deal</span>' : '',
      v.certified   ? '<span class="badge badge-new">CPO Certified</span>' : '',
      v.featured    ? '<span class="badge badge-featured">Featured</span>' : ''
    ].filter(Boolean).join('');
  }

  setText('vehicleMainTitle', `${v.year} ${v.make} ${v.model}`);
  setText('vehicleTrimLine',  v.trim);
  setText('vehicleStock',     v.stockNumber || '—');
  setText('vehicleVin',       v.vin || '—');

  // Key specs
  const keyWrap = document.getElementById('vehicleKeySpecs');
  if (keyWrap) {
    const mpg = v.fuelType === 'Electric' ? (v.range ? `${v.range}mi` : 'EV') : (v.mpgHighway ? `${v.mpgHighway} mpg` : '—');
    keyWrap.innerHTML = `
      <div class="key-spec-item">
        <div class="key-spec-icon"><i data-lucide="zap" width="16" height="16"></i></div>
        <span class="key-spec-val">${v.horsepower || '—'} hp</span>
        <span class="key-spec-label">Power</span>
      </div>
      <div class="key-spec-item">
        <div class="key-spec-icon"><i data-lucide="gauge" width="16" height="16"></i></div>
        <span class="key-spec-val">${v.mileage > 0 ? v.mileage.toLocaleString() + ' mi' : 'Brand New'}</span>
        <span class="key-spec-label">Mileage</span>
      </div>
      <div class="key-spec-item">
        <div class="key-spec-icon"><i data-lucide="fuel" width="16" height="16"></i></div>
        <span class="key-spec-val">${mpg}</span>
        <span class="key-spec-label">${v.fuelType === 'Electric' ? 'Range' : 'Fuel Econ.'}</span>
      </div>
      <div class="key-spec-item">
        <div class="key-spec-icon"><i data-lucide="settings-2" width="16" height="16"></i></div>
        <span class="key-spec-val">${v.transmission || '—'}</span>
        <span class="key-spec-label">Transmission</span>
      </div>
      <div class="key-spec-item">
        <div class="key-spec-icon"><i data-lucide="git-branch" width="16" height="16"></i></div>
        <span class="key-spec-val">${v.drivetrain || '—'}</span>
        <span class="key-spec-label">Drivetrain</span>
      </div>
      <div class="key-spec-item">
        <div class="key-spec-icon"><i data-lucide="users" width="16" height="16"></i></div>
        <span class="key-spec-val">${v.seats || '—'}</span>
        <span class="key-spec-label">Seats</span>
      </div>
    `;
  }

  // Color
  const colorWrap = document.getElementById('vehicleColorWrap');
  if (colorWrap && v.color) {
    colorWrap.innerHTML = `
      <div class="color-swatch" style="background:${v.colorHex || '#888'}" title="${v.color}"></div>
      <span>${v.color}${v.interiorColor ? ` / ${v.interiorColor}` : ''}</span>
    `;
  }

  // Price
  const priceWrap = document.getElementById('vehiclePriceBlock');
  if (priceWrap) {
    const savings = v.originalPrice && v.originalPrice > v.price ? v.originalPrice - v.price : 0;
    priceWrap.innerHTML = `
      <span class="vehicle-price-main">ksh ${v.price.toLocaleString()}</span>
      <div class="vehicle-price-row">
      
      </div>
    `;
  }

  // Monthly
  const monthlyWrap = document.getElementById('vehicleMonthly');
  if (monthlyWrap) {
    monthlyWrap.innerHTML = `Estimated <strong>ksh ${Math.round(v.price / 60).toLocaleString()}/mo</strong> with $5,000 down for 60 months`;
  }

  // Quick info
  setText('vehicleWarranty',    v.warranty || 'Contact us for warranty details');
  setText('vehicleLocation',    v.location || 'Main Showroom');
  setText('vehicleDateAdded',    v.dateAdded ? new Date(v.dateAdded).toLocaleDateString() : 'Recently added');

  // Modal titles
  setText('modalVehicleTitle',  `${v.year} ${v.make} ${v.model} ${v.trim}`);
  setText('tdModalVehicle',     `${v.year} ${v.make} ${v.model} ${v.trim}`);

  // Compare link
  const compareLink = document.getElementById('compareLink');
  if (compareLink) compareLink.href = `inventory.html?compare=${v.id}`;
}

/* ============================================================
   TABS
   ============================================================ */
function bindTabEvents() {
  document.querySelectorAll('.spec-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.spec-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === target);
        t.setAttribute('aria-selected', t.dataset.tab === target);
      });
      document.querySelectorAll('.spec-tab-content').forEach(c => {
        c.classList.toggle('hidden', c.id !== `tab-${target}`);
        c.classList.toggle('active', c.id === `tab-${target}`);
      });
    });
  });
}

/* ============================================================
   OVERVIEW TAB
   ============================================================ */
function renderOverviewTab(v) {
  setText('vehicleDescription', v.description || 'No description available.');

  const highlightsWrap = document.getElementById('overviewHighlights');
  if (!highlightsWrap) return;

  const highlights = [
    { icon: 'calendar', text: `${v.year} Model Year` },
    { icon: 'fuel', text: v.fuelType || 'Gasoline' },
    { icon: 'settings-2', text: v.transmission || 'Automatic' },
    { icon: 'git-branch', text: v.drivetrain || 'RWD' },
    { icon: 'zap', text: `${v.horsepower || '—'} HP` },
    { icon: 'box', text: `${v.doors || '—'} Doors` },
    { icon: 'users', text: `${v.seats || '—'} Seats` },
    { icon: 'palette', text: v.color || '—' }
  ].filter(h => h.text !== '—');

  highlightsWrap.innerHTML = highlights.map(h => `
    <div class="highlight-item">
      <i data-lucide="${h.icon}" width="16" height="16"></i>
      <span>${h.text}</span>
    </div>
  `).join('');
}

/* ============================================================
   SPECS TAB
   ============================================================ */
function renderSpecsTab(v) {
  const grid = document.getElementById('specsGrid');
  if (!grid) return;

  const specs = [
    ['Make', v.make],
    ['Model', v.model],
    ['Trim', v.trim],
    ['Year', v.year],
    ['Condition', v.condition === 'new' ? 'Brand New' : 'Pre-Owned'],
    ['Mileage', v.mileage > 0 ? v.mileage.toLocaleString() + ' mi' : '0 mi (New)'],
    ['Engine', v.engine || '—'],
    ['Transmission', v.transmission || '—'],
    ['Drivetrain', v.drivetrain || '—'],
    ['Horsepower', v.horsepower ? v.horsepower + ' hp' : '—'],
    ['Torque', v.torque ? v.torque + ' lb-ft' : '—'],
    ['Fuel Type', v.fuelType || '—'],
    ['MPG City', v.mpgCity || '—'],
    ['MPG Highway', v.mpgHighway || '—'],
    ['Range', v.range ? v.range + ' mi' : '—'],
    ['Doors', v.doors || '—'],
    ['Seats', v.seats || '—'],
    ['Exterior Color', v.color || '—'],
    ['Interior Color', v.interiorColor || '—'],
    ['VIN', v.vin || '—'],
    ['Stock Number', v.stockNumber || '—']
  ];

  grid.innerHTML = specs.map(([key, val]) => `
    <div class="spec-row">
      <span class="spec-key">${key}</span>
      <span class="spec-val">${val}</span>
    </div>
  `).join('');
}

/* ============================================================
   FEATURES TAB
   ============================================================ */
function renderFeaturesTab(v) {
  const grid = document.getElementById('featuresGrid');
  if (!grid || !v.features) return;
  grid.innerHTML = v.features.map(f => `
    <div class="feature-item">${f}</div>
  `).join('');
}

/* ============================================================
   SAFETY TAB
   ============================================================ */
function renderSafetyTab(v) {
  const list = document.getElementById('safetyList');
  if (!list || !v.safetyFeatures) return;
  list.innerHTML = v.safetyFeatures.map(f => `
    <div class="safety-item">
      <i data-lucide="shield-check" width="16" height="16"></i>
      <span>${f}</span>
    </div>
  `).join('');
}

/* ============================================================
   CALCULATOR
   ============================================================ */
function renderCalculator(v) {
  const calcDown  = document.getElementById('calcDown');
  const calcTerm  = document.getElementById('calcTerm');
  const calcRate  = document.getElementById('calcRate');
  if (!calcDown || !calcTerm || !calcRate) return;

  function update() {
    const down   = parseFloat(calcDown.value) || 0;
    const term   = parseInt(calcTerm.value) || 60;
    const rate   = parseFloat(calcRate.value) || 0;
    const amount = Math.max(0, v.price - down);
    const r      = rate / 100 / 12;
    const n      = term;

    let monthly;
    if (rate === 0) {
      monthly = amount / n;
    } else {
      monthly = amount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const el = document.getElementById('calcMonthly');
    if (el) el.textContent = `ksh ${Math.round(monthly).toLocaleString()}/mo`;
  }

  [calcDown, calcTerm, calcRate].forEach(el => el.addEventListener('input', update));
  update();
}

function bindCalculator() {
  // Already bound in renderCalculator
}

/* ============================================================
   MODALS
   ============================================================ */
function bindModalEvents() {
  // Enquiry modal
  const enqModal   = document.getElementById('enquiryModal');
  const enqBtn     = document.getElementById('enquireBtn');
  const closeEnq   = document.getElementById('closeEnquiryModal');
  const cancelEnq  = document.getElementById('cancelEnquiry');
  const submitEnq  = document.getElementById('submitEnquiry');

  enqBtn?.addEventListener('click', () => {
    enqModal?.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  [closeEnq, cancelEnq].forEach(btn => {
    btn?.addEventListener('click', () => {
      enqModal?.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  submitEnq?.addEventListener('click', () => {
    if (validateEnquiry()) {
      showToast('Enquiry sent successfully!', 'success');
      enqModal?.classList.remove('active');
      document.body.style.overflow = '';
      document.getElementById('enquiryForm')?.reset();
    }
  });

  // Test drive modal
  const tdModal    = document.getElementById('testDriveModal');
  const tdBtn      = document.getElementById('testDriveBtn');
  const closeTd    = document.getElementById('closeTdModal');
  const cancelTd   = document.getElementById('cancelTd');
  const submitTd   = document.getElementById('submitTd');

  tdBtn?.addEventListener('click', () => {
    tdModal?.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  [closeTd, cancelTd].forEach(btn => {
    btn?.addEventListener('click', () => {
      tdModal?.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  submitTd?.addEventListener('click', () => {
    if (validateTestDrive()) {
      showToast('Test drive booked successfully!', 'success');
      tdModal?.classList.remove('active');
      document.body.style.overflow = '';
      document.getElementById('testDriveForm')?.reset();
    }
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // ESC key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => {
        m.classList.remove('active');
      });
      document.body.style.overflow = '';
    }
  });
}

function validateEnquiry() {
  let valid = true;
  const required = ['enqFirstName', 'enqLastName', 'enqEmail'];
  required.forEach(id => {
    const el = document.getElementById(id);
    const err = document.getElementById('err-' + id.replace('enq','').replace(/^[A-Z]/, c => c.toLowerCase()));
    if (!el?.value.trim()) {
      valid = false;
      el?.classList.add('is-error');
      if (err) err.textContent = 'This field is required';
    } else {
      el?.classList.remove('is-error');
      if (err) err.textContent = '';
    }
  });

  // Email validation
  const email = document.getElementById('enqEmail');
  const emailErr = document.getElementById('err-email');
  if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    valid = false;
    email.classList.add('is-error');
    if (emailErr) emailErr.textContent = 'Please enter a valid email';
  }

  // Consent
  const consent = document.getElementById('enqConsent');
  const consentErr = document.getElementById('err-consent');
  if (consent && !consent.checked) {
    valid = false;
    if (consentErr) consentErr.textContent = 'You must agree to be contacted';
  } else {
    if (consentErr) consentErr.textContent = '';
  }

  return valid;
}

function validateTestDrive() {
  let valid = true;
  const required = ['tdName', 'tdPhone', 'tdEmail', 'tdDate', 'tdTime'];
  required.forEach(id => {
    const el = document.getElementById(id);
    if (!el?.value.trim()) {
      valid = false;
      el?.classList.add('is-error');
    } else {
      el?.classList.remove('is-error');
    }
  });

  // Email validation
  const email = document.getElementById('tdEmail');
  if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    valid = false;
    email.classList.add('is-error');
  }

  // Date must be in future
  const dateEl = document.getElementById('tdDate');
  if (dateEl && dateEl.value) {
    const selected = new Date(dateEl.value);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selected < today) {
      valid = false;
      dateEl.classList.add('is-error');
    }
  }

  return valid;
}

/* ============================================================
   ACTION BUTTONS
   ============================================================ */
function bindActionButtons() {
  // Wishlist
  const wishBtn = document.getElementById('wishlistBtn');
  if (wishBtn && Detail.vehicle) {
    const id = Detail.vehicle.id;
    const list = getWishlist();
    wishBtn.classList.toggle('active', list.includes(id));
    wishBtn.addEventListener('click', () => {
      const current = getWishlist();
      const idx = current.indexOf(id);
      if (idx === -1) {
        current.push(id);
        wishBtn.classList.add('active');
        showToast('Added to wishlist', 'success');
      } else {
        current.splice(idx, 1);
        wishBtn.classList.remove('active');
        showToast('Removed from wishlist', 'info');
      }
      localStorage.setItem('ae_wishlist', JSON.stringify(current));
    });
  }

  // Share
  document.getElementById('shareBtn')?.addEventListener('click', () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url });
    } else {
      navigator.clipboard.writeText(url).then(() => showToast('Link copied to clipboard', 'success'));
    }
  });

  // Print
  document.getElementById('printBtn')?.addEventListener('click', () => window.print());
}

function getWishlist() {
  try { return JSON.parse(localStorage.getItem('ae_wishlist') || '[]'); } catch { return []; }
}

/* ============================================================
   SIMILAR VEHICLES
   ============================================================ */
function renderSimilar() {
  const v = Detail.vehicle;
  if (!v) return;

  // Find similar: same type, similar price range, excluding self
  const similar = Detail.allVehicles
    .filter(x => x.id !== v.id && x.type === v.type)
    .sort((a, b) => {
      const aDiff = Math.abs(a.price - v.price);
      const bDiff = Math.abs(b.price - v.price);
      return aDiff - bDiff;
    })
    .slice(0, 4);

  const grid = document.getElementById('similarGrid');
  if (!grid) return;

  if (similar.length === 0) {
    grid.innerHTML = '<p class="text-secondary text-center" style="grid-column:1/-1">No similar vehicles found.</p>';
    return;
  }

  grid.innerHTML = similar.map(x => `
    <a href="vehicle-detail.html?id=${x.id}" class="vehicle-card">
      <div class="card-img-wrap">
        ${x.thumbnail
          ? `<img class="card-img" src="${x.thumbnail}" alt="${x.year} ${x.make} ${x.model}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'card-img-placeholder\\'><span>No Image</span></div>'" />`
          : `<div class="card-img-placeholder"><span>No Image</span></div>`
        }
        <div class="card-badges">
          ${x.condition === 'new' ? '<span class="badge badge-new">New</span>' : '<span class="badge badge-used">Pre-Owned</span>'}
        </div>
      </div>
      <div class="card-body">
        <div class="card-title-row">
          <h3 class="card-title">${x.make} ${x.model}</h3>
          <span class="card-year">${x.year}</span>
        </div>
        <p class="card-trim">${x.trim}</p>
        <div class="card-specs">
          <div class="card-spec">
            <span class="card-spec-val">${x.horsepower ? x.horsepower + ' hp' : '—'}</span>
            <span class="card-spec-key">Power</span>
          </div>
          <div class="card-spec">
            <span class="card-spec-val">${x.mileage > 0 ? x.mileage.toLocaleString() + ' mi' : 'New'}</span>
            <span class="card-spec-key">Mileage</span>
          </div>
          <div class="card-spec">
            <span class="card-spec-val">${x.fuelType === 'Electric' ? (x.range ? x.range + 'mi' : 'EV') : (x.mpgHighway || '—')}</span>
            <span class="card-spec-key">${x.fuelType === 'Electric' ? 'Range' : 'MPG'}</span>
          </div>
        </div>
        <div class="card-footer">
          <span class="card-price">ksh ${x.price.toLocaleString()}</span>
          <span class="btn btn-secondary btn-sm">View</span>
        </div>
      </div>
    </a>
  `).join('');

  if (window.lucide) lucide.createIcons({ nodes: [grid] });
}

/* ============================================================
   HELPERS
   ============================================================ */
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function hideLoading() {
  document.getElementById('detailLoading')?.classList.add('hidden');
}

function showContent() {
  document.getElementById('detailContent')?.classList.remove('hidden');
}

function showError() {
  document.getElementById('detailLoading')?.classList.add('hidden');
  document.getElementById('detailError')?.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function showToast(msg, type = 'info') {
  if (window.showToast) window.showToast(msg, type);
}

/* Expose */
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;