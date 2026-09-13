/* ГЛУБИНА — логика: пузыри, статус, каталог (поиск+фильтры), страницы-детали,
   нижняя таб-панель, пружинные появления. Данные — из window.GLUBINA (data/creatures.js). */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const D = window.GLUBINA;

/* ---------- пузыри ---------- */

(function bubbles() {
  const box = $('.bubbles');
  if (!box) return;
  const n = 14;
  for (let i = 0; i < n; i++) {
    const b = document.createElement('i');
    b.className = 'bubble';
    const size = 10 + Math.random() * 46;
    b.style.width = b.style.height = size + 'px';
    b.style.left = Math.random() * 100 + '%';
    b.style.animationDuration = (14 + Math.random() * 18) + 's';
    b.style.animationDelay = (-Math.random() * 24) + 's';
    b.style.opacity = (0.25 + Math.random() * 0.5).toFixed(2);
    box.appendChild(b);
  }
})();

/* ---------- статус открыт/закрыт ---------- */

(function status() {
  const el = $('#openStatus');
  if (!el) return;
  const now = new Date();
  const day = now.getDay();
  const h = now.getHours() + now.getMinutes() / 60;
  const open = day !== D.hours.closedDay && h >= D.hours.open && h < D.hours.close;
  el.classList.toggle('is-open', open);
  el.innerHTML = open
    ? '<span class="dot"></span> Сейчас открыто / до 20:00'
    : '<span class="dot"></span> Сейчас закрыто / откроемся в 10:00';
})();

/* ---------- активный пункт навигации ---------- */

(function markNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('.head__nav a, .tabbar a').forEach((a) => {
    const t = a.getAttribute('href');
    if (t === page) a.classList.add('is-here');
  });
})();

/* ---------- пружинные появления ---------- */

const rvIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); rvIO.unobserve(en.target); }
  });
}, { threshold: 0.15 });
$$('.rv').forEach((el) => {
  const d = el.dataset.d;
  if (d !== undefined) el.style.setProperty('--d', d);
  rvIO.observe(el);
});

/* ---------- каталог: рендер + поиск + фильтры ---------- */

const catGrid = $('#creatures');
if (catGrid) {
  const state = { q: '', zone: 'all', type: 'all' };
  const searchInput = $('#searchInput');
  const zoneChips = $('#zoneChips');
  const typeChips = $('#typeChips');
  const emptyBox = $('#emptyBox');

  function zoneColor(z) { return (D.zones[z] || {}).color || '#2a9df4'; }
  function zoneName(z) { return (D.zones[z] || {}).name || z; }

  function matches(c) {
    const q = state.q.trim().toLowerCase();
    const okQ = !q || (c.name + ' ' + c.latin + ' ' + c.fact + ' ' + c.hall).toLowerCase().includes(q);
    const okZ = state.zone === 'all' || c.zone === state.zone;
    const okT = state.type === 'all' || c.type === state.type;
    return okQ && okZ && okT;
  }
  function render() {
    let shown = 0;
    catGrid.innerHTML = D.creatures.filter(matches).map((c, i) => `
      <a class="ccard rv in" data-d="${i % 4}" href="creature.html?id=${c.id}" style="--zc:${zoneColor(c.zone)}">
        <span class="ccard__zone">${zoneName(c.zone)}</span>
        <div class="ccard__img"><img src="${c.img}" alt="${c.name}" loading="lazy"></div>
        <b>${c.name}</b>
        <span class="latin">${c.latin}</span>
        <span class="ccard__go"><span>Смотреть карточку</span><em>→</em></span>
      </a>
    `).join('');
    shown = catGrid.children.length;
    emptyBox.hidden = shown !== 0;
  }

  if (searchInput) searchInput.addEventListener('input', () => { state.q = searchInput.value; render(); });
  function chipbar(bar, key) {
    if (!bar) return;
    bar.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      $$('.chip', bar).forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      state[key] = chip.dataset.f;
      render();
    });
  }
  chipbar(zoneChips, 'zone');
  chipbar(typeChips, 'type');
  render();
}

/* ---------- страница-деталь: рендер по ?id ---------- */

const detailRoot = $('#detailRoot');
if (detailRoot) {
  const id = new URLSearchParams(location.search).get('id');
  const c = D.creatures.find((x) => x.id === id);
  if (!c) { location.replace('catalog.html'); }
  else {
    const zone = D.zones[c.zone];
    document.title = `${c.name} — ГЛУБИНА / океанариум`;
    const neighbours = D.creatures.filter((x) => x.zone === c.zone && x.id !== c.id).slice(0, 3);
    detailRoot.innerHTML = `
      <div class="wrap">
        <a class="backlink" href="catalog.html">← Весь каталог</a>
        <div class="detail__top">
          <div class="detail__img rv in">
            <img src="${c.img}" alt="${c.name}">
          </div>
          <div class="rv in" data-d="1">
            <span class="label" style="--zc:${zone.color}; color:#fff; background:${zone.color}; border-color:${zone.color};">${zone.name} / ${c.hall}</span>
            <h1 class="h1" style="margin-top:16px">${c.name}</h1>
            <p class="latin" style="font-style:italic; color:var(--muted); margin-top:6px">${c.latin} / ${c.type}</p>
            <div class="detail__facts">
              <div class="fact"><span>Размер</span><b>${c.size}</b></div>
              <div class="fact"><span>Глубина</span><b>${c.depth}</b></div>
              <div class="fact"><span>Вода</span><b>${c.temp}</b></div>
              <div class="fact"><span>Рацион</span><b>${c.diet}</b></div>
            </div>
          </div>
        </div>
        <div class="detail__factbox rv in" data-d="2">${c.fact}</div>
        <div class="detail__neighbours rv in" data-d="3">
          <span class="label">Соседи по залу:</span>
          ${neighbours.map((n) => `<a class="chip" href="creature.html?id=${n.id}">${n.name} →</a>`).join('')}
          <a class="chip" href="zones.html">О зоне «${zone.name}» →</a>
        </div>
      </div>
    `;
  }
}

/* ---------- зоны: список обитателей ---------- */

const zonesRoot = $('#zonesRoot');
if (zonesRoot) {
  zonesRoot.innerHTML = Object.entries(D.zones).map(([key, z], i) => {
    const list = D.creatures.filter((c) => c.zone === key);
    return `
      <div class="zone rv" data-d="${i}" style="--zc:${z.color}">
        <div class="zone__badge">${i + 1}</div>
        <div class="zone__body">
          <h3>${z.name}</h3>
          <p class="meta">глубина ${z.depth}</p>
          <p>${z.desc}</p>
          <div class="zone__list">
            ${list.map((c) => `<a href="creature.html?id=${c.id}">${c.name}</a>`).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ---------- кормления на главной ---------- */

const feedBox = $('#feedBox');
if (feedBox) {
  feedBox.innerHTML = D.feedings.map((f) => `
    <div class="feed__row">
      <span class="feed__time">${f.time}</span>
      <span class="feed__what"><b>${f.what}</b><span>${f.zone}</span></span>
    </div>
  `).join('');
}
