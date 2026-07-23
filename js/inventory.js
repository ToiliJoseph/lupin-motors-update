/* ============================================================
   INVENTORY.JS — Lupin Motors
   Full filter, search, sort, pagination & compare engine
   Works with data/vehicles.json (scales to 1000+ records)
   ============================================================ */


'use strict';

/* ============================================================
   STATE
   ============================================================ */
const State = {
  all:        [],        // all vehicles from JSON
  filtered:   [],        // after filters applied
  page:       1,
  perPage:    24,
  view:       'grid',    // 'grid' | 'list'
  compareList: [],       // max 3 vehicle ids
  filters: {
    search:    '',
    condition: '',
    make:      '',
    model:     '',
    types:     [],
    yearMin:   '',
    yearMax:   '',
    priceMin:  0,
    priceMax:  50000000,
    mileage:   '',
    fuels:     [],
    drives:    [],
    featured:  false,
    deals:     false,
    certified: false
  },
  sort: 'default'
};

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  await loadVehicles();
  readURLParams();
  buildFilterUI();
  applyFilters();
  bindEvents();
  initPriceSlider();
  lucide.createIcons();
});

/* ============================================================
   LOAD DATA
   ============================================================ */
async function loadVehicles() {
  try {
    const res  = await fetch('data/vehicles.json');
    State.all  = await res.json();
  } catch (e) {
    console.error('Failed to load vehicles.json', e);
    State.all = [];
  }
  updateHeaderStats();
}

function updateHeaderStats() {
  const v = State.all;
  setEl('totalCount', v.length);
  setEl('newCount',   v.filter(x => x.condition === 'new').length);
  setEl('usedCount',  v.filter(x => x.condition === 'pre-owned').length);
  setEl('dealCount',  v.filter(x => x.weeklyDeal).length);
}

/* ============================================================
   READ URL PARAMS (hero search → inventory)
   ============================================================ */
function readURLParams() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('make'))       State.filters.make      = p.get('make');
  if (p.get('type'))       State.filters.types      = [p.get('type')];
  if (p.get('condition'))  State.filters.condition  = p.get('condition');
  if (p.get('maxPrice'))   State.filters.priceMax   = parseInt(p.get('maxPrice'));
  if (p.get('filter') === 'deals') State.filters.deals = true;
  syncUIToState();
}

/* ============================================================
   BUILD DYNAMIC FILTER UI
   ============================================================ */
function buildFilterUI() {
  buildMakeSelect();
  buildCheckboxList('typeFilterList',  getUnique('type'),     'types',  fmtType);
  buildCheckboxList('fuelFilterList',  getUnique('fuelType'), 'fuels',  v => v);
  buildCheckboxList('driveFilterList', getUnique('drivetrain'),'drives', v => v);
  buildYearSelects();
}

function getUnique(field) {
  return [...new Set(State.all.map(v => v[field]).filter(Boolean))].sort();
}

function buildMakeSelect() {
  const sel   = document.getElementById('filterMake');
  const makes = getUnique('make');
  makes.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m;
    sel.appendChild(opt);
  });
  if (State.filters.make) sel.value = State.filters.make;
}

function buildCheckboxList(containerId, values, stateKey, labelFn) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = '';
  values.forEach(val => {
    const count = State.all.filter(v => {
      if (Array.isArray(v[stateKey])) return v[stateKey].includes(val);
      const field = stateKey === 'types' ? 'type' : stateKey === 'fuels' ? 'fuelType' : 'drivetrain';
      return v[field] === val;
    }).length;

    const item = document.createElement('div');
    item.className = 'filter-check-item';
    const id = `chk-${stateKey}-${val.replace(/\s/g,'_')}`;
    item.innerHTML = `
      <label for="${id}">
        <input type="checkbox" id="${id}" value="${val}" data-group="${stateKey}" />
        ${labelFn(val)}
      </label>
      <span class="filter-check-count">${count}</span>
    `;
    wrap.appendChild(item);
  });

  // Sync checked state
  syncCheckboxGroup(stateKey);
}

function syncCheckboxGroup(stateKey) {
  const keyMap = { types:'types', fuels:'fuels', drives:'drives' };
  const arr = State.filters[keyMap[stateKey]] || [];
  document.querySelectorAll(`[data-group="${stateKey}"]`).forEach(cb => {
    cb.checked = arr.includes(cb.value);
  });
}

function buildYearSelects() {
  const years = getUnique('year').map(Number).sort((a,b) => b-a);
  const minSel = document.getElementById('filterYearMin');
  const maxSel = document.getElementById('filterYearMax');
  years.forEach(y => {
    [minSel, maxSel].forEach(sel => {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      sel.appendChild(opt);
    });
  });
  if (State.filters.yearMin) minSel.value = State.filters.yearMin;
  if (State.filters.yearMax) maxSel.value = State.filters.yearMax;
}

function fmtType(t) {
  const map = {
    suv:'SUV', sedan:'Sedan', truck:'Truck', coupe:'Coupe',
    electric:'Electric', convertible:'Convertible', van:'Van'
  };
  return map[t] || t.charAt(0).toUpperCase() + t.slice(1);
}

/* ============================================================
   SYNC UI ← STATE
   ============================================================ */
function syncUIToState() {
  const f = State.filters;

  // Search
  const si = document.getElementById('searchInput');
  if (si) si.value = f.search;

  // Condition toggles
  document.querySelectorAll('[data-filter="condition"]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === f.condition);
  });

  // Make
  const ms = document.getElementById('filterMake');
  if (ms) ms.value = f.make;

  // Checkboxes
  document.querySelectorAll('[data-group="types"]').forEach(cb => {
    cb.checked = f.types.includes(cb.value);
  });

  // Specials
  const fd = document.getElementById('filterDeals');
  if (fd) fd.checked = f.deals;
}

/* ============================================================
   BIND EVENTS
   ============================================================ */
function bindEvents() {
  // Search
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClearBtn');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(e => {
      State.filters.search = e.target.value.trim().toLowerCase();
      searchClear?.classList.toggle('hidden', !e.target.value);
      resetPage(); applyFilters();
    }, 260));
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      State.filters.search = '';
      searchClear.classList.add('hidden');
      resetPage(); applyFilters();
    });
  }

  // Condition toggles
  document.querySelectorAll('[data-filter="condition"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter="condition"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.filters.condition = btn.dataset.value;
      resetPage(); applyFilters();
    });
  });

  // Make
  document.getElementById('filterMake')?.addEventListener('change', e => {
    State.filters.make  = e.target.value;
    State.filters.model = '';
    buildModelSelect(e.target.value);
    resetPage(); applyFilters();
  });

  // Model
  document.getElementById('filterModel')?.addEventListener('change', e => {
    State.filters.model = e.target.value;
    resetPage(); applyFilters();
  });

  // Checkbox groups
  document.addEventListener('change', e => {
    const group = e.target.dataset.group;
    if (!group) return;
    const keyMap = { types:'types', fuels:'fuels', drives:'drives' };
    const key = keyMap[group];
    if (!key) return;
    const checked = [...document.querySelectorAll(`[data-group="${group}"]:checked`)].map(c => c.value);
    State.filters[key] = checked;
    resetPage(); applyFilters();
  });

  // Year range
  document.getElementById('filterYearMin')?.addEventListener('change', e => {
    State.filters.yearMin = e.target.value;
    updateYearLabel();
    resetPage(); applyFilters();
  });
  document.getElementById('filterYearMax')?.addEventListener('change', e => {
    State.filters.yearMax = e.target.value;
    updateYearLabel();
    resetPage(); applyFilters();
  });

  // Mileage
  document.getElementById('filterMileage')?.addEventListener('change', e => {
    State.filters.mileage = e.target.value;
    resetPage(); applyFilters();
  });

  // Special switches
  ['filterFeatured','filterDeals','filterCertified'].forEach(id => {
    const key = id.replace('filter','').toLowerCase();
    document.getElementById(id)?.addEventListener('change', e => {
      State.filters[key] = e.target.checked;
      resetPage(); applyFilters();
    });
  });

  // Sort
  document.getElementById('sortSelect')?.addEventListener('change', e => {
    State.sort = e.target.value;
    resetPage(); applyFilters();
  });

  // Per page
  document.getElementById('perPageSelect')?.addEventListener('change', e => {
    State.perPage = parseInt(e.target.value);
    resetPage(); applyFilters();
  });

  // View toggle
  document.getElementById('gridViewBtn')?.addEventListener('click', () => setView('grid'));
  document.getElementById('listViewBtn')?.addEventListener('click', () => setView('list'));

  // Clear all
  document.getElementById('clearAllFilters')?.addEventListener('click', clearAllFilters);
  document.getElementById('resetFromEmpty')?.addEventListener('click', clearAllFilters);

  // Mobile filter toggle
  document.getElementById('filterToggleMobile')?.addEventListener('click', openMobileFilters);
  document.getElementById('filterOverlay')?.addEventListener('click', closeMobileFilters);
  document.getElementById('applyFiltersMobile')?.addEventListener('click', closeMobileFilters);

  // Compare drawer
  document.getElementById('closeCompareDrawer')?.addEventListener('click', () => {
    document.getElementById('compareDrawer')?.classList.remove('visible');
  });
  document.getElementById('compareBtn')?.addEventListener('click', () => {
    const drawer = document.getElementById('compareDrawer');
    drawer?.classList.toggle('visible');
    drawer?.classList.remove('hidden');
  });
  document.getElementById('goCompareBtn')?.addEventListener('click', () => {
    if (State.compareList.length < 2) return;
    window.location.href = `vehicle-detail.html?compare=${State.compareList.join(',')}`;
  });
}

/* ============================================================
   MODEL SELECT (dynamic based on make)
   ============================================================ */
function buildModelSelect(make) {
  const sel = document.getElementById('filterModel');
  if (!sel) return;
  sel.innerHTML = '<option value="">All Models</option>';
  if (!make) { sel.disabled = true; return; }
  const models = [...new Set(
    State.all.filter(v => v.make === make).map(v => v.model)
  )].sort();
  models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m;
    sel.appendChild(opt);
  });
  sel.disabled = false;
}

/* ============================================================
   PRICE SLIDER
   ============================================================ */
function initPriceSlider() {
  const minR = document.getElementById('priceMin');
  const maxR = document.getElementById('priceMax');
  if (!minR || !maxR) return;

  function update() {
    let lo = parseInt(minR.value);
    let hi = parseInt(maxR.value);
    if (lo > hi) { [lo, hi] = [hi, lo]; }
    State.filters.priceMin = lo;
    State.filters.priceMax = hi;

    const pct1 = (lo / 50000000) * 100;
    const pct2 = (hi / 50000000) * 100;

    const track = document.getElementById('priceTrack');
    if (track) {
      track.style.left  = pct1 + '%';
      track.style.width = (pct2 - pct1) + '%';
    }

    setEl('priceMinDisplay', 'ksh' + lo.toLocaleString());
    setEl('priceMaxDisplay', hi >= 50000000 ? 'ksh 50000000+' : 'ksh' + hi.toLocaleString());
    updatePriceLabel(lo, hi);
    resetPage(); applyFilters();
  }

  minR.addEventListener('input', debounce(update, 200));
  maxR.addEventListener('input', debounce(update, 200));
  update(); // Initial draw
}

function updatePriceLabel(lo, hi) {
  const label = document.getElementById('priceRangeLabel');
  if (!label) return;
  if (lo === 0 && hi >= 50000000) {
    label.textContent = 'Any';
  } else {
    label.textContent = `ksh ${(lo/1000).toFixed(0)}k – ksh ${hi >= 50000000 ? '50000000k+' : (hi/1000).toFixed(0) + 'k'}`;
  }
}

function updateYearLabel() {
  const label = document.getElementById('yearRangeLabel');
  if (!label) return;
  const min = State.filters.yearMin;
  const max = State.filters.yearMax;
  if (!min && !max) label.textContent = 'Any';
  else if (min && !max) label.textContent = `${min}+`;
  else if (!min && max) label.textContent = `Up to ${max}`;
  else label.textContent = `${min} – ${max}`;
}

/* ============================================================
   APPLY FILTERS
   ============================================================ */
function applyFilters() {
  const f   = State.filters;
  let   res = [...State.all];

  // Search
  if (f.search) {
    const q = f.search.toLowerCase();
    res = res.filter(v =>
      [v.make, v.model, v.trim, v.type, v.color, v.fuelType, String(v.year)]
        .join(' ').toLowerCase().includes(q) ||
      (v.features || []).some(ft => ft.toLowerCase().includes(q))
    );
  }

  // Condition
  if (f.condition) res = res.filter(v => v.condition === f.condition);

  // Make
  if (f.make) res = res.filter(v => v.make === f.make);

  // Model
  if (f.model) res = res.filter(v => v.model === f.model);

  // Types
  if (f.types.length) res = res.filter(v => f.types.includes(v.type));

  // Year
  if (f.yearMin) res = res.filter(v => v.year >= parseInt(f.yearMin));
  if (f.yearMax) res = res.filter(v => v.year <= parseInt(f.yearMax));

  // Price
  res = res.filter(v => v.price >= f.priceMin && v.price <= f.priceMax);

  // Mileage
  if (f.mileage) res = res.filter(v => v.mileage <= parseInt(f.mileage));

  // Fuel types
  if (f.fuels.length) res = res.filter(v => f.fuels.includes(v.fuelType));

  // Drivetrain
  if (f.drives.length) res = res.filter(v => f.drives.some(d => (v.drivetrain || '').includes(d)));

  // Special
  if (f.featured)  res = res.filter(v => v.featured);
  if (f.deals)     res = res.filter(v => v.weeklyDeal);
  if (f.certified) res = res.filter(v => v.certified);

  // Sort
  res = sortVehicles(res, State.sort);

  State.filtered = res;

  renderGrid();
  renderPagination();
  updateToolbarCount();
  updateActiveFilterTags();
  updateFilterBadge();
}

/* ============================================================
   SORT
   ============================================================ */
function sortVehicles(arr, method) {
  switch (method) {
    case 'price-asc':   return [...arr].sort((a,b) => a.price - b.price);
    case 'price-desc':  return [...arr].sort((a,b) => b.price - a.price);
    case 'year-desc':   return [...arr].sort((a,b) => b.year  - a.year);
    case 'year-asc':    return [...arr].sort((a,b) => a.year  - b.year);
    case 'mileage-asc': return [...arr].sort((a,b) => a.mileage - b.mileage);
    case 'name-asc':    return [...arr].sort((a,b) => `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`));

    case 'default':     // ← ADD THIS LINE
      return arr; 
      
    case 'featured':
    default:
      return [...arr].sort((a,b) => {
        if (b.featured !== a.featured) return b.featured ? 1 : -1;
        if (b.weeklyDeal !== a.weeklyDeal) return b.weeklyDeal ? 1 : -1;
        return (b.views || 0) - (a.views || 0);
      });
  }
}

/* ============================================================
   RENDER GRID
   ============================================================ */
function renderGrid() {
  const grid = document.getElementById('vehicleGrid');
  const noR  = document.getElementById('noResults');
  if (!grid) return;

  const start = (State.page - 1) * State.perPage;
  const page  = State.filtered.slice(start, start + State.perPage);

  if (State.filtered.length === 0) {
    grid.innerHTML = '';
    noR?.classList.remove('hidden');
    document.getElementById('paginationWrap')?.classList.add('hidden');
    return;
  }

  noR?.classList.add('hidden');
  document.getElementById('paginationWrap')?.classList.remove('hidden');

  grid.className = `vehicle-grid${State.view === 'list' ? ' list-view' : ''}`;
  grid.innerHTML = page.map(v => buildCard(v)).join('');

  // Re-init icons inside newly rendered cards
  if (window.lucide) lucide.createIcons();

  // Bind card events
  grid.querySelectorAll('.vehicle-card').forEach(card => {
    const id = card.dataset.id;

    // Click card → detail page
    card.addEventListener('click', e => {
      if (e.target.closest('.card-action-btn, .card-compare-wrap, input')) return;
      window.location.href = `vehicle-detail.html?id=${id}`;
    });

    // Wishlist btn
    card.querySelector('.wishlist-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      toggleWishlist(id, e.currentTarget);
    });

    // Compare checkbox
    card.querySelector('.compare-cb')?.addEventListener('change', e => {
      e.stopPropagation();
      toggleCompare(id, e.target.checked, card);
    });
  });
}

/* ============================================================
   BUILD CARD HTML
   ============================================================ */
function buildCard(v) {
  const isWishlisted = getWishlist().includes(v.id);
  const isCompared   = State.compareList.includes(v.id);
  const savings      = v.originalPrice && v.originalPrice > v.price
    ? v.originalPrice - v.price : 0;
  const mpg = v.fuelType === 'Electric'
    ? (v.range ? `${v.range}mi` : 'EV')
    : (v.mpgHighway ? `${v.mpgHighway} mpg` : '—');

  const imgHtml = v.thumbnail
    ? `<img class="card-img" src="${v.thumbnail}" alt="${v.year} ${v.make} ${v.model}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'card-img-placeholder\\'><svg width=\\'48\\' height=\\'48\\' viewBox=\\'0 0 48 48\\' fill=\\'none\\'><rect x=\\'8\\' y=\\'18\\' width=\\'32\\' height=\\'16\\' rx=\\'2\\' stroke=\\'%23c9a84c\\' stroke-width=\\'1.5\\'/><circle cx=\\'16\\' cy=\\'36\\' r=\\'4\\' stroke=\\'%23c9a84c\\' stroke-width=\\'1.5\\'/><circle cx=\\'32\\' cy=\\'36\\' r=\\'4\\' stroke=\\'%23c9a84c\\' stroke-width=\\'1.5\\'/></svg><span>No Image</span></div>'" />`
    : `<div class="card-img-placeholder">
        <svg width="48" height="48" viewBox="0 0 64 48" fill="none">
          <path d="M8 36h48M10 36l8-18h28l10 18" stroke="#c9a84c" stroke-width="2" stroke-linecap="round"/>
          <circle cx="20" cy="38" r="6" stroke="#c9a84c" stroke-width="2"/>
          <circle cx="44" cy="38" r="6" stroke="#c9a84c" stroke-width="2"/>
        </svg>
        <span>Photo Coming Soon</span>
       </div>`;

  const badges = [
    v.condition === 'new'   ? `<span class="badge badge-new">New</span>` : `<span class="badge badge-used">Pre-Owned</span>`,
    v.weeklyDeal            ? `<span class="badge badge-deal">Weekly Deal</span>` : '',
    v.certified             ? `<span class="badge badge-new">CPO</span>` : '',
    v.featured              ? `<span class="badge badge-featured">Featured</span>` : ''
  ].filter(Boolean).slice(0,2).join('');

 

  return `
    <article class="vehicle-card${v.weeklyDeal ? ' deal-card' : ''}" data-id="${v.id}" role="button" tabindex="0" aria-label="${v.year} ${v.make} ${v.model}">

      <div class="card-img-wrap">
        ${imgHtml}
        <div class="card-badges">${badges}</div>
        <div class="card-actions">
          <button class="card-action-btn wishlist-btn${isWishlisted ? ' active' : ''}" title="Save to wishlist" aria-label="Save">
            <i data-lucide="heart" width="15" height="15"></i>
          </button>
          <button class="card-action-btn" title="Share" onclick="shareVehicle('${v.id}', event)">
            <i data-lucide="share-2" width="15" height="15"></i>
          </button>
        </div>
        ${v.colorHex ? `<div class="card-color-dot" style="background:${v.colorHex}" title="${v.color}"></div>` : ''}
        ${(v.images||[]).length > 1 ? `<div class="card-img-count"><i data-lucide="image" width="11" height="11"></i>${(v.images||[]).length}</div>` : ''}
      </div>

      <div class="card-body">
        <div class="card-title-row">
          <h3 class="card-title">${v.make} ${v.model}</h3>
          <span class="card-year">${v.year}</span>
        </div>
        <p class="card-trim">${v.trim}</p>

        <div class="card-specs">
          <div class="card-spec">
            <span class="card-spec-val">${v.horsepower ? v.horsepower + ' hp' : '—'}</span>
            <span class="card-spec-key">Power</span>
          </div>
          <div class="card-spec">
            <span class="card-spec-val">${v.mileage > 0 ? v.mileage.toLocaleString() + ' mi' : 'Brand New'}</span>
            <span class="card-spec-key">Mileage</span>
          </div>
          <div class="card-spec">
            <span class="card-spec-val">${mpg}</span>
            <span class="card-spec-key">${v.fuelType === 'Electric' ? 'Range' : 'Fuel Econ.'}</span>
          </div>
        </div>    

        <div class="card-footer">
          <div class="card-price-block">
            <span class="card-price">ksh ${v.price.toLocaleString()}</span>
            <div class="card-price-row">              
            </div>
            <span class="card-price-monthly">Est. ksh ${Math.round(v.price / 60).toLocaleString()}/mo</span>
          </div>
          <a href="vehicle-detail.html?id=${v.id}" class="btn btn-secondary btn-sm card-cta" onclick="event.stopPropagation()">
            View Details
          </a>
        </div>
      </div>

      <div class="card-compare-wrap">
        <label class="card-compare-label">
          <input type="checkbox" class="compare-cb" ${isCompared ? 'checked' : ''} />
          Add to Compare
        </label>
      </div>

    </article>
  `;
}

/* ============================================================
   PAGINATION
   ============================================================ */
function renderPagination() {
  const wrap = document.getElementById('pagination');
  if (!wrap) return;

  const total = State.filtered.length;
  const pages = Math.ceil(total / State.perPage);
  const cur   = State.page;

  if (pages <= 1) { wrap.innerHTML = ''; return; }

  let html = '';

  // Prev
  html += `<button class="page-btn" ${cur === 1 ? 'disabled' : ''} onclick="goToPage(${cur-1})">
    <i data-lucide="chevron-left" width="16" height="16"></i>
  </button>`;

  // Page numbers with ellipsis
  const range = buildPageRange(cur, pages);
  range.forEach(p => {
    if (p === '...') {
      html += `<span style="color:var(--text-faint);padding:0 4px">…</span>`;
    } else {
      html += `<button class="page-btn${p === cur ? ' active' : ''}" onclick="goToPage(${p})">${p}</button>`;
    }
  });

  // Next
  html += `<button class="page-btn" ${cur === pages ? 'disabled' : ''} onclick="goToPage(${cur+1})">
    <i data-lucide="chevron-right" width="16" height="16"></i>
  </button>`;

  wrap.innerHTML = html;
  if (window.lucide) lucide.createIcons({ nodes: [wrap] });
}

function buildPageRange(cur, total) {
  if (total <= 7) return Array.from({length: total}, (_,i) => i+1);
  const pages = [];
  if (cur <= 4) {
    pages.push(...[1,2,3,4,5,'...',total]);
  } else if (cur >= total - 3) {
    pages.push(1,'...',...[total-4,total-3,total-2,total-1,total]);
  } else {
    pages.push(1,'...',cur-1,cur,cur+1,'...',total);
  }
  return pages;
}

function goToPage(n) {
  const pages = Math.ceil(State.filtered.length / State.perPage);
  State.page  = Math.max(1, Math.min(n, pages));
  renderGrid();
  renderPagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.goToPage = goToPage;

/* ============================================================
   TOOLBAR COUNTS
   ============================================================ */
function updateToolbarCount() {
  const start = (State.page - 1) * State.perPage;
  const end   = Math.min(start + State.perPage, State.filtered.length);
  setEl('showingCount', `${start + 1}–${end}`);
  setEl('ofCount', State.filtered.length);
}

/* ============================================================
   ACTIVE FILTER TAGS
   ============================================================ */
function updateActiveFilterTags() {
  const wrap = document.getElementById('activeFilters');
  const list = document.getElementById('activeFiltersList');
  if (!wrap || !list) return;

  const tags = [];
  const f = State.filters;
  if (f.condition) tags.push({ label: f.condition === 'new' ? 'New' : 'Pre-Owned', key: 'condition' });
  if (f.make)      tags.push({ label: f.make,  key: 'make' });
  if (f.model)     tags.push({ label: f.model, key: 'model' });
  if (f.types.length) f.types.forEach(t => tags.push({ label: fmtType(t), key: 'types', val: t }));
  if (f.fuels.length) f.fuels.forEach(t => tags.push({ label: t, key: 'fuels', val: t }));
  if (f.drives.length) f.drives.forEach(t => tags.push({ label: t, key: 'drives', val: t }));
  if (f.yearMin)   tags.push({ label: `From ${f.yearMin}`, key: 'yearMin' });
  if (f.yearMax)   tags.push({ label: `To ${f.yearMax}`,   key: 'yearMax' });
  if (f.search)    tags.push({ label: `"${f.search}"`,     key: 'search' });
  if (f.mileage)   tags.push({ label: `<${parseInt(f.mileage).toLocaleString()} mi`, key: 'mileage' });
  if (f.featured)  tags.push({ label: 'Featured', key: 'featured' });
  if (f.deals)     tags.push({ label: 'Deals', key: 'deals' });
  if (f.certified) tags.push({ label: 'CPO', key: 'certified' });

  wrap.style.display = tags.length ? 'block' : 'none';
  list.innerHTML = tags.map(t => `
    <span class="active-filter-tag">
      ${t.label}
      <button onclick="removeFilter('${t.key}','${t.val||''}')" aria-label="Remove filter">
        <i data-lucide="x" width="10" height="10"></i>
      </button>
    </span>
  `).join('');
  if (window.lucide) lucide.createIcons({ nodes: [list] });
}

function removeFilter(key, val) {
  const f = State.filters;
  if (Array.isArray(f[key])) {
    f[key] = f[key].filter(v => v !== val);
  } else if (key === 'search') {
    f.search = '';
    const si = document.getElementById('searchInput');
    if (si) si.value = '';
  } else if (key === 'priceMin') { f.priceMin = 0; }
  else if (key === 'priceMax') { f.priceMax = 50000000; }
  else { f[key] = typeof f[key] === 'boolean' ? false : ''; }
  syncUIToState();
  syncCheckboxGroup('types');
  syncCheckboxGroup('fuels');
  syncCheckboxGroup('drives');
  resetPage(); applyFilters();
}

window.removeFilter = removeFilter;

/* ============================================================
   FILTER BADGE COUNT
   ============================================================ */
function updateFilterBadge() {
  const f = State.filters;
  let count = 0;
  if (f.condition) count++;
  if (f.make)      count++;
  if (f.model)     count++;
  if (f.search)    count++;
  if (f.mileage)   count++;
  if (f.yearMin)   count++;
  if (f.yearMax)   count++;
  if (f.featured)  count++;
  if (f.deals)     count++;
  if (f.certified) count++;
  count += f.types.length + f.fuels.length + f.drives.length;
  if (f.priceMin > 0 || f.priceMax < 50000000) count++;

  const badge = document.getElementById('filterBadge');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  }
}

/* ============================================================
   CLEAR ALL FILTERS
   ============================================================ */
function clearAllFilters() {
  State.filters = {
    search:'', condition:'', make:'', model:'',
    types:[], yearMin:'', yearMax:'',
    priceMin:0, priceMax:50000000,
    mileage:'', fuels:[], drives:[],
    featured:false, deals:false, certified:false
  };

  // Reset UI elements
  const si = document.getElementById('searchInput');
  if (si) si.value = '';
  document.getElementById('searchClearBtn')?.classList.add('hidden');
  document.querySelectorAll('[data-filter="condition"]').forEach((b,i) => b.classList.toggle('active', i === 0));
  document.getElementById('filterMake')  && (document.getElementById('filterMake').value = '');
  document.getElementById('filterModel') && (document.getElementById('filterModel').value = '');
  document.getElementById('filterModel')?.setAttribute('disabled', true);
  document.getElementById('filterYearMin') && (document.getElementById('filterYearMin').value = '');
  document.getElementById('filterYearMax') && (document.getElementById('filterYearMax').value = '');
  document.getElementById('filterMileage') && (document.getElementById('filterMileage').value = '');
  document.getElementById('filterFeatured') && (document.getElementById('filterFeatured').checked = false);
  document.getElementById('filterDeals')    && (document.getElementById('filterDeals').checked = false);
  document.getElementById('filterCertified')&& (document.getElementById('filterCertified').checked = false);
  document.getElementById('priceMin') && (document.getElementById('priceMin').value = 0);
  document.getElementById('priceMax') && (document.getElementById('priceMax').value = 50000000);
  document.querySelectorAll('[data-group]').forEach(cb => cb.checked = false);

  initPriceSlider();
  resetPage(); applyFilters();
}

/* ============================================================
   VIEW TOGGLE
   ============================================================ */
function setView(v) {
  State.view = v;
  document.getElementById('gridViewBtn')?.classList.toggle('active', v === 'grid');
  document.getElementById('listViewBtn')?.classList.toggle('active', v === 'list');
  renderGrid();
}

/* ============================================================
   MOBILE FILTERS
   ============================================================ */
function openMobileFilters() {
  document.getElementById('filterSidebar')?.classList.add('mobile-open');
  document.getElementById('filterOverlay')?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeMobileFilters() {
  document.getElementById('filterSidebar')?.classList.remove('mobile-open');
  document.getElementById('filterOverlay')?.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ============================================================
   WISHLIST (localStorage)
   ============================================================ */
function getWishlist() {
  try { return JSON.parse(localStorage.getItem('ae_wishlist') || '[]'); } catch { return []; }
}

function toggleWishlist(id, btn) {
  let list = getWishlist();
  const i  = list.indexOf(id);
  if (i === -1) {
    list.push(id);
    btn.classList.add('active');
    showToast('Added to wishlist', 'success');
  } else {
    list.splice(i, 1);
    btn.classList.remove('active');
    showToast('Removed from wishlist', 'info');
  }
  localStorage.setItem('ae_wishlist', JSON.stringify(list));
}

/* ============================================================
   COMPARE
   ============================================================ */
function toggleCompare(id, checked, card) {
  if (checked) {
    if (State.compareList.length >= 3) {
      card.querySelector('.compare-cb').checked = false;
      showToast('You can compare up to 3 vehicles', 'warning');
      return;
    }
    State.compareList.push(id);
  } else {
    State.compareList = State.compareList.filter(i => i !== id);
  }
  updateCompareUI();
}

function updateCompareUI() {
  const count = State.compareList.length;
  setEl('compareCount', count);
  setEl('compareDrawerCount', count);

  const compareBtn = document.getElementById('compareBtn');
  compareBtn?.classList.toggle('hidden', count === 0);

  const goBtn = document.getElementById('goCompareBtn');
  if (goBtn) goBtn.disabled = count < 2;

  const slots = document.getElementById('compareSlots');
  if (!slots) return;

  const vehicles = State.compareList.map(id => State.all.find(v => v.id === id)).filter(Boolean);
  slots.innerHTML = vehicles.map(v => `
    <div class="compare-slot filled">
      <span>${v.year} ${v.make} ${v.model}</span>
      <button class="compare-slot-remove" onclick="removeCompare('${v.id}')">
        <i data-lucide="x" width="12" height="12"></i>
      </button>
    </div>
  `).join('') + (count < 3 ? `<div class="compare-slot">+ Add vehicle</div>` : '');

  const drawer = document.getElementById('compareDrawer');
  if (drawer) {
    drawer.classList.remove('hidden');
    drawer.classList.toggle('visible', count > 0);
  }

  if (window.lucide) lucide.createIcons({ nodes: [slots] });
}

function removeCompare(id) {
  State.compareList = State.compareList.filter(i => i !== id);
  // Uncheck card checkbox
  const card = document.querySelector(`[data-id="${id}"] .compare-cb`);
  if (card) card.checked = false;
  updateCompareUI();
}

window.removeCompare = removeCompare;

/* ============================================================
   SHARE VEHICLE
   ============================================================ */
function shareVehicle(id, e) {
  e.stopPropagation();
  const url = `${window.location.origin}${window.location.pathname.replace('inventory.html','vehicle-detail.html')}?id=${id}`;
  if (navigator.share) {
    navigator.share({ title: 'Check out this vehicle at Lupin Motors', url });
  } else {
    navigator.clipboard.writeText(url).then(() => showToast('Link copied to clipboard', 'success'));
  }
}

window.shareVehicle = shareVehicle;

/* ============================================================
   HELPERS
   ============================================================ */
function resetPage() { State.page = 1; }

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function showToast(msg, type = 'info') {
  if (window.showToast) window.showToast(msg, type);
}