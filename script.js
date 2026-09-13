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
// контент, который появляется позже (рендер из данных), тоже должен раскрываться
new MutationObserver((muts) => {
  muts.forEach((m) => m.addedNodes.forEach((n) => {
    if (n.nodeType !== 1) return;
    if (n.classList && n.classList.contains('rv')) rvIO.observe(n);
    if (n.querySelectorAll) n.querySelectorAll('.rv:not(.in)').forEach((el) => rvIO.observe(el));
  }));
}).observe(document.body, { childList: true, subtree: true });

/* ---------- каталог: рендер + поиск + фильтры + сортировка ---------- */

const catGrid = $('#creatures');
if (catGrid) {
  const state = { q: '', zone: 'all', type: 'all', sort: 'name' };
  const searchInput = $('#searchInput');
  const zoneChips = $('#zoneChips');
  const typeChips = $('#typeChips');
  const sortChips = $('#sortChips');
  const emptyBox = $('#emptyBox');
  const foundCount = $('#foundCount');

  function zoneColor(z) { return (D.zones[z] || {}).color || '#2a9df4'; }
  function zoneName(z) { return (D.zones[z] || {}).name || z; }
  function hl(text) {
    const q = state.q.trim();
    if (!q) return esc(text);
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function matches(c) {
    const q = state.q.trim().toLowerCase();
    const okQ = !q || (c.name + ' ' + c.latin + ' ' + c.fact + ' ' + c.hall).toLowerCase().includes(q);
    const okZ = state.zone === 'all' || c.zone === state.zone;
    const okT = state.type === 'all' || c.type === state.type;
    return okQ && okZ && okT;
  }
  function sorted(list) {
    const arr = [...list];
    if (state.sort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    if (state.sort === 'rarity') arr.sort((a, b) => b.stats.rarity - a.stats.rarity || b.stats.wow - a.stats.wow);
    if (state.sort === 'activity') arr.sort((a, b) => b.stats.activity - a.stats.activity);
    if (state.sort === 'wow') arr.sort((a, b) => b.stats.wow - a.stats.wow);
    return arr;
  }
  function render() {
    const list = sorted(D.creatures.filter(matches));
    foundCount.textContent = `Найдено ${list.length} <i>/</i> ${D.creatures.length}`;
    catGrid.innerHTML = list.map((c, i) => `
      <a class="ccard rv in" data-d="${i % 4}" href="creature.html?id=${c.id}" style="--zc:${zoneColor(c.zone)}">
        <span class="ccard__zone">${zoneName(c.zone)}</span>
        <div class="ccard__img"><img src="${c.img}" alt="${c.name}" loading="lazy"></div>
        <b>${hl(c.name)}</b>
        <span class="latin">${hl(c.latin)}</span>
        <span class="ccard__go"><span>Смотреть карточку</span><em>→</em></span>
      </a>
    `).join('');
    emptyBox.hidden = list.length !== 0;
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
  chipbar(sortChips, 'sort');
  render();
}

/* ---------- страница-деталь: рендер по ?id ---------- */

function barsHTML(stats, color) {
  const labels = { activity: 'Активность', rarity: 'Редкость', friendly: 'Дружелюбие', wow: 'Вау-эффект' };
  return Object.entries(stats).map(([k, v]) => `
    <div class="bar">
      <span class="bar__label">${labels[k]}</span>
      <span class="bar__track"><span class="bar__fill" style="transform:scaleX(${v / 5});background:${color}"></span></span>
      <b class="bar__val">${v}<i>/5</i></b>
    </div>
  `).join('');
}
function depthGaugeHTML(zoneKey) {
  const zones = ['surface', 'reef', 'twilight', 'deep'];
  const pos = zones.indexOf(zoneKey);
  const zm = D.zones[zoneKey].depthM;
  return `
    <div class="gauge">
      <div class="gauge__zones">
        ${zones.map((k) => `<i style="background:${D.zones[k].color}"></i>`).join('')}
      </div>
      <span class="gauge__fill" style="width:${(zm / 90) * 100}%"></span>
      <span class="gauge__mark" style="left:${(zm / 90) * 100}%">▲</span>
    </div>
    <p class="gauge__note">Живёт на глубине ~${zm} м — в зоне «${D.zones[zoneKey].name}».</p>
  `;
}

const detailRoot = $('#detailRoot');
if (detailRoot) {
  const id = new URLSearchParams(location.search).get('id');
  const c = D.creatures.find((x) => x.id === id);
  if (!c) { location.replace('catalog.html'); }
  else {
    const zone = D.zones[c.zone];
    document.title = `${c.name} — ГЛУБИНА / океанариум`;
    const neighbours = D.creatures.filter((x) => x.zone === c.zone && x.id !== c.id).slice(0, 4);
    detailRoot.innerHTML = `
      <div class="wrap">
        <a class="backlink" href="catalog.html">← Весь каталог</a>
        <div class="detail__top">
          <div class="detail__img rv in">
            <img src="${c.img}" alt="${c.name}">
          </div>
          <div class="rv in" data-d="1">
            <span class="label" style="color:#fff; background:${zone.color}; border-color:${zone.color};">${zone.name} / ${c.hall}</span>
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
        <div class="detail__stats rv in" data-d="3">
          <h3 class="h3">Характер по шкалам</h3>
          <div class="bars">${barsHTML(c.stats, zone.color)}</div>
          ${depthGaugeHTML(c.zone)}
        </div>
        <div class="detail__neighbours rv in" data-d="4">
          <span class="label">Соседи по залу:</span>
          ${neighbours.map((n) => `<a class="chip" href="creature.html?id=${n.id}">${n.name}</a>`).join('')}
          <a class="chip" href="compare.html?ids=${c.id},${(neighbours[0] || D.creatures[0]).id}">Сравнить →</a>
          <a class="chip" href="zones.html">О зоне «${zone.name}» →</a>
        </div>
      </div>
    `;
  }
}

/* ---------- сравнение двух обитателей ---------- */

const cmpRoot = $('#cmpRoot');
if (cmpRoot) {
  const params = new URLSearchParams(location.search).get('ids');
  const parts = (params || '').split(',').filter(Boolean);
  const a = D.creatures.find((x) => x.id === parts[0]) || D.creatures[0];
  let b = D.creatures.find((x) => x.id === parts[1]) || D.creatures.find((x) => x.id !== a.id);
  const opts = (sel) => D.creatures.map((c) => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${c.name}</option>`).join('');
  const row = (label, va, vb, better) => `
    <div class="cmp__row">
      <span class="cmp__cell ${better === 'a' ? 'is-win' : ''}">${va}</span>
      <span class="cmp__label">${label}</span>
      <span class="cmp__cell ${better === 'b' ? 'is-win' : ''}">${vb}</span>
    </div>`;
  const barsRow = (label, key) => row(label, `${a.stats[key]} / 5`, `${b.stats[key]} / 5`, a.stats[key] > b.stats[key] ? 'a' : b.stats[key] > a.stats[key] ? 'b' : 'none');
  const zoneName = (z) => D.zones[z].name;
  cmpRoot.innerHTML = `
    <div class="wrap">
      <div class="cmp__picks rv in">
        <select id="cmpA">${opts(a.id)}</select>
        <span class="cmp__vs">VS</span>
        <select id="cmpB">${opts(b.id)}</select>
      </div>
      <div class="cmp__head rv in" data-d="1">
        <div class="cmp__who"><img src="${a.img}" alt=""><b>${a.name}</b></div>
        <div class="cmp__who"><img src="${b.img}" alt=""><b>${b.name}</b></div>
      </div>
      <div class="cmp__table rv in" data-d="2">
        ${row('Зона', zoneName(a.zone), zoneName(b.zone), 'none')}
        ${row('Размер', a.size, b.size, 'none')}
        ${row('Глубина', a.depth, b.depth, D.zones[a.zone].depthM > D.zones[b.zone].depthM ? 'a' : D.zones[b.zone].depthM > D.zones[a.zone].depthM ? 'b' : 'none')}
        ${row('Вода', a.temp, b.temp, 'none')}
        ${row('Рацион', a.diet, b.diet, 'none')}
        ${barsRow('Активность', 'activity')}
        ${barsRow('Редкость', 'rarity')}
        ${barsRow('Дружелюбие', 'friendly')}
        ${barsRow('Вау-эффект', 'wow')}
      </div>
      <p class="footnote rv in" data-d="3" style="margin-top: 24px;">Подсвечено то, чей показатель выше<i>/</i>при равенстве подсветки нет</p>
      <div class="cmp__links rv in" data-d="4">
        <a class="btn btn--white" href="creature.html?id=${a.id}"><span>Карточка: ${a.name}</span></a>
        <a class="btn btn--white" href="creature.html?id=${b.id}"><span>Карточка: ${b.name}</span></a>
      </div>
    </div>
  `;
  const ra = $('#cmpA'), rb = $('#cmpB');
  ra.addEventListener('change', () => { location.href = `compare.html?ids=${ra.value},${rb.value}`; });
  rb.addEventListener('change', () => { location.href = `compare.html?ids=${ra.value},${rb.value}`; });
}

/* ---------- квиз «Кто ты из Глубины» ---------- */

const quizRoot = $('#quizRoot');
if (quizRoot) {
  const QUESTIONS = [
    {
      q: 'Твоё идеальное утро?',
      opts: [
        ['Поспать на солнечной полке', ['turtle', 'puffer']],
        ['Суетиться у рифа с утра до ночи', ['clownfish', 'crab']],
        ['Дрейфовать в полумраке', ['jelly', 'cuttle']],
        ['Лежать на дне и наблюдать', ['shark', 'star', 'ray']],
      ],
    },
    {
      q: 'Выбери суперсилу',
      opts: [
        ['Менять узор на коже', ['cuttle', 'octopus']],
        ['Раздуваться до шарика', ['puffer']],
        ['Носить с собой скальпель', ['tang']],
        ['Три сердца и девять мозгов', ['octopus', 'mantis', 'jelly']],
      ],
    },
    {
      q: 'Какой ты сосед?',
      opts: [
        ['Всем помогаю и всех успокаиваю', ['anemone', 'seahorse', 'turtle']],
        ['Держу дистанцию — ничего личного', ['moray', 'lion', 'shark']],
        ['Главный на своём этаже', ['grouper', 'manta', 'trigger']],
        ['Стою в очереди за раковиной', ['crab', 'clownfish']],
      ],
    },
    {
      q: 'Твоя глубина души?',
      opts: [
        ['Поверхность: свет и волны', ['turtle', 'puffer', 'tang', 'trigger']],
        ['Риф: шумно и весело', ['clownfish', 'seahorse', 'crab', 'lion', 'angel', 'anemone']],
        ['Сумерки: тихий полумрак', ['jelly', 'octopus', 'moray', 'cuttle', 'mantis']],
        ['Бездна: медленно и величественно', ['ray', 'shark', 'star', 'manta', 'grouper']],
      ],
    },
    {
      q: 'Что ты выберешь на обед?',
      opts: [
        ['Крабы и улитки', ['octopus', 'mantis', 'shark']],
        ['Планктон — лёгкий перекус', ['jelly', 'manta', 'seahorse']],
        ['Водоросли — растительная тема', ['tang', 'turtle']],
        ['Креветки — изысканно', ['lion', 'grouper', 'cuttle']],
      ],
    },
  ];

  let step = 0;
  const scores = {};
  const dots = $('#qDots');
  const body = $('#quizBody');

  function renderDots() {
    dots.innerHTML = QUESTIONS.map((_, i) =>
      `<i class="${i < step ? 'done' : i === step ? 'now' : ''}">${i + 1}</i>`).join('');
  }
  function renderQ() {
    const item = QUESTIONS[step];
    renderDots();
    body.innerHTML = `
      <p class="quiz__q">${item.q}</p>
      <div class="qopts">
        ${item.opts.map((o, j) => `<button class="qopt" data-j="${j}" type="button"><span>${o[0]}</span><em class="qarr">→</em></button>`).join('')}
      </div>
    `;
    $$('.qopt', body).forEach((b) => b.addEventListener('click', () => {
      const ids = item.opts[+b.dataset.j][1];
      ids.forEach((id) => { scores[id] = (scores[id] || 0) + 1; });
      step++;
      step < QUESTIONS.length ? renderQ() : renderResult();
    }));
  }
  function renderResult() {
    const top = Object.entries(scores).sort((x, y) => y[1] - x[1])[0];
    const c = D.creatures.find((x) => x.id === top[0]) || D.creatures[0];
    const zone = D.zones[c.zone];
    renderDots();
    body.innerHTML = `
      <p class="label" style="color:#fff;background:${zone.color};border-color:${zone.color}">Твой результат</p>
      <div class="qres">
        <img src="${c.img}" alt="${c.name}">
        <div>
          <p class="h2">${c.name}</p>
          <p class="latin" style="font-style:italic;color:var(--muted)">${c.latin} / ${zone.name}</p>
          <div class="bars" style="margin-top:14px">${barsHTML(c.stats, zone.color)}</div>
          <div class="qres__links">
            <a class="btn btn--coral" href="creature.html?id=${c.id}"><span>Карточка ${c.name}</span></a>
            <button class="btn btn--white" id="qAgain" type="button"><span>Пройти ещё раз</span></button>
          </div>
        </div>
      </div>
    `;
    $('#qAgain').addEventListener('click', () => { step = 0; Object.keys(scores).forEach((k) => delete scores[k]); renderQ(); });
  }
  renderQ();
}

/* ---------- дневник биолога ---------- */

const journalList = $('#journalList');
if (journalList) {
  const box = $('#journalTags');
  const tags = ['Все', ...new Set(window.GLUBINA_JOURNAL.map((e) => e.tag))];
  let tag = 'Все';
  function renderJournal() {
    const list = window.GLUBINA_JOURNAL.filter((e) => tag === 'Все' || e.tag === tag);
    journalList.innerHTML = list.map((e, i) => {
      const c = D.creatures.find((x) => x.id === e.link);
      return `
        <article class="jentry rv in" data-d="${i % 4}">
          <div class="jentry__meta"><time>${new Date(e.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</time><span class="jtag">${e.tag}</span></div>
          <h3 class="h3">${e.title}</h3>
          <p>${e.text}</p>
          ${c ? `<a class="tile__go" href="creature.html?id=${c.id}">Карточка: ${c.name} <em>→</em></a>` : ''}
        </article>
      `;
    }).join('');
  }
  box.innerHTML = tags.map((t) => `<button class="chip ${t === 'Все' ? 'is-active' : ''}" data-tag="${t}" type="button">${t}</button>`).join('');
  box.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    $$('.chip', box).forEach((c) => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    tag = chip.dataset.tag;
    renderJournal();
  });
  renderJournal();
}

/* ---------- обитатель дня на главной ---------- */

const codayBox = $('#codayBox');
if (codayBox) {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const c = D.creatures[dayOfYear % D.creatures.length];
  const zone = D.zones[c.zone];
  codayBox.innerHTML = `
    <img src="${c.img}" alt="${c.name}">
    <div>
      <span class="label">Обитатель дня<i>/</i>${zone.name}</span>
      <h3 class="h3" style="margin-top:10px">${c.name}</h3>
      <p class="muted" style="font-size:14px; margin:8px 0 14px">${c.fact}</p>
      <a class="btn btn--deep" href="creature.html?id=${c.id}"><span>Его карточка</span><em class="btn__arrow">→</em></a>
    </div>
  `;
}

/* ---------- зоны: список обитателей ---------- */

const zonesRoot = $('#zonesRoot');
if (zonesRoot) {
  zonesRoot.innerHTML = Object.entries(D.zones).map(([key, z], i) => {
    const list = D.creatures.filter((c) => c.zone === key);
    return `
      <div class="zone rv in" data-d="${i}" style="--zc:${z.color}">
        <div class="zone__badge">${i + 1}</div>
        <div class="zone__body">
          <h3>${z.name}</h3>
          <p class="meta">глубина ${z.depth} / жителей: ${list.length}</p>
          <p>${z.desc}</p>
          <div class="zone__depth"><span style="width:${(z.depthM / 90) * 100}%;background:${z.color}"></span></div>
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
