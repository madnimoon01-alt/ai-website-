// Paste your AI-generated JavaScript here
// ============================================================
// APEX MOTORS — showroom logic
// Loads data.json, renders filter tabs + car cards, drives the
// cursor-follow spotlight, and powers the detail modal.
// ============================================================

const els = {
  floorGlow: document.getElementById('floorGlow'),
  filters: document.getElementById('filters'),
  showroom: document.getElementById('showroom'),
  carCount: document.getElementById('carCount'),
  modal: document.getElementById('modal'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  modalPanel: document.getElementById('modalPanel'),
};

let cars = [];
let activeClass = 'All';

init();

async function init() {
  bindSpotlight();
  bindModalDismiss();

  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    cars = await res.json();
  } catch (err) {
    console.error('Could not load data.json:', err);
    els.showroom.innerHTML = `
      <div class="load-error" style="grid-column:1/-1; color:var(--text-dim); font-family:var(--font-mono); font-size:0.85rem;">
        Couldn't load data.json. If you opened this file directly in the browser,
        run a local server instead (e.g. <code>python3 -m http.server</code>)
        and open the page through http://localhost — browsers block fetch()
        on the file:// protocol.
      </div>`;
    return;
  }

  renderFilters();
  renderCards(cars);
  animateCount(cars.length);
}

function renderFilters() {
  const classes = ['All', ...new Set(cars.map(c => c.class))];
  els.filters.innerHTML = classes.map(cls => `
    <button class="filter-btn ${cls === activeClass ? 'active' : ''}" data-class="${cls}">
      ${cls}
    </button>
  `).join('');

  els.filters.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeClass = btn.dataset.class;
      els.filters.querySelectorAll('.filter-btn').forEach(b =>
        b.classList.toggle('active', b === btn)
      );
      const filtered = activeClass === 'All'
        ? cars
        : cars.filter(c => c.class === activeClass);
      renderCards(filtered);
    });
  });
}

function renderCards(list) {
  if (!list.length) {
    els.showroom.innerHTML = `
      <p style="grid-column:1/-1; color:var(--text-faint); font-family:var(--font-mono); font-size:0.85rem;">
        Nothing on the floor in this class right now.
      </p>`;
    return;
  }

  els.showroom.innerHTML = list.map(car => `
    <article class="card" tabindex="0" data-id="${car.id}" role="button" aria-label="View details for ${car.make} ${car.model}">
      <div class="card-media">
        <span class="card-class-tag">${car.class}</span>
        <span class="card-price-tag">${car.price}</span>
        ${mediaMarkup(car)}
      </div>
      <div class="card-body">
        <p class="card-make">${car.make} &middot; ${car.year}</p>
        <h2 class="card-model">${car.model}</h2>
        <p class="card-tagline">${car.tagline}</p>
        <div class="card-specs">
          ${specMarkup(car.specs)}
        </div>
      </div>
    </article>
  `).join('');

  els.showroom.querySelectorAll('.card').forEach(card => {
    const open = () => openModal(card.dataset.id);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
}

// Renders an <img> if the file exists on disk, otherwise a
// placeholder so the layout looks right before real photos land.
function mediaMarkup(car) {
  return `<img src="${car.image}" alt="${car.make} ${car.model}"
            onerror="this.replaceWith(Object.assign(document.createElement('div'),
              {className:'placeholder', textContent:'Add ${car.image} to see the ${car.make} ${car.model}'}))">`;
}

function specMarkup(specs) {
  const labels = {
    power: 'Power',
    torque: 'Torque',
    zeroToSixty: '0&ndash;60',
    topSpeed: 'Top speed',
  };
  return Object.entries(specs).map(([key, value]) => `
    <div class="spec">
      <span class="spec-value">${value}</span>
      <span class="spec-label">${labels[key] || key}</span>
    </div>
  `).join('');
}

function animateCount(target) {
  const start = performance.now();
  const duration = 600;
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.round(progress * target);
    els.carCount.textContent = String(value).padStart(2, '0');
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ---------- modal ----------
function openModal(id) {
  const car = cars.find(c => c.id === id);
  if (!car) return;

  els.modalPanel.innerHTML = `
    <button class="modal-close" id="modalClose" aria-label="Close">&times;</button>
    <div class="modal-media">${mediaMarkup(car)}</div>
    <div class="modal-body">
      <p class="card-make">${car.make} &middot; ${car.year} &middot; ${car.class}</p>
      <h2 class="card-model" style="font-size:2rem;">${car.model}</h2>
      <p class="modal-desc">${car.description}</p>
      <div class="modal-specs">${specMarkup(car.specs)}</div>
    </div>
  `;

  els.modal.classList.add('open');
  els.modal.setAttribute('aria-hidden', 'false');
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  els.modal.classList.remove('open');
  els.modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function bindModalDismiss() {
  els.modalBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

// ---------- ambient spotlight that follows the cursor ----------
function bindSpotlight() {
  window.addEventListener('pointermove', e => {
    const xPct = (e.clientX / window.innerWidth) * 100;
    const yPct = (e.clientY / window.innerHeight) * 100;
    els.floorGlow.style.setProperty('--mx', `${xPct}%`);
    els.floorGlow.style.setProperty('--my', `${yPct}%`);
  }, { passive: true });
}
