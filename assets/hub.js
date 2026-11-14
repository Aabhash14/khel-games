/* Khel hub: language toggle, turning boxes over, "pick for me", played stickers. */
(() => {
  const root = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode: fine */ } },
  };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- language ---- */
  const langBtns = document.querySelectorAll('[data-set-lang]');
  function setLang(lang) {
    root.lang = lang;
    langBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)));
    store.set('khel.lang', lang);
  }
  langBtns.forEach(b => b.addEventListener('click', () => setLang(b.dataset.setLang)));
  const savedLang = store.get('khel.lang');
  setLang(savedLang === 'en' || savedLang === 'ne'
    ? savedLang
    : (navigator.language || '').toLowerCase().startsWith('ne') ? 'ne' : 'en');

  /* ---- opened from disk: folder links need an explicit index.html ---- */
  if (location.protocol === 'file:') {
    document.querySelectorAll('a.play').forEach(a => {
      const href = a.getAttribute('href');
      if (href.endsWith('/')) a.setAttribute('href', href + 'index.html');
    });
  }

  /* ---- played stickers ---- */
  let played = [];
  try { played = JSON.parse(store.get('khel.played') || '[]'); } catch { played = []; }
  if (!Array.isArray(played)) played = [];
  function showStickers() {
    played.forEach(id => {
      const s = document.querySelector(`#${CSS.escape(id)} .sticker`);
      if (s) s.hidden = false;
    });
  }
  showStickers();

  /* ---- turning boxes ---- */
  const boxes = [...document.querySelectorAll('.box')];
  let openBox = null;

  function parts(box) {
    return {
      front: box.querySelector('.front'),
      back: box.querySelector('.back'),
      turn: box.querySelector('.turn'),
      slot: box.closest('.slot'),
    };
  }

  function open(box) {
    if (openBox === box) return;
    if (openBox) close(openBox, false);
    const p = parts(box);
    box.classList.add('is-open');
    p.slot.classList.add('is-open');
    p.turn.setAttribute('aria-expanded', 'true');
    p.front.inert = true;
    p.back.inert = false;
    openBox = box;
    if (location.hash !== '#' + box.id) history.replaceState(null, '', '#' + box.id);
    const target = p.back.querySelector('.play') || p.back.querySelector('.back-btn');
    setTimeout(() => target && target.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 320);
  }

  function close(box, returnFocus = true) {
    const p = parts(box);
    box.classList.remove('is-open');
    p.slot.classList.remove('is-open');
    p.turn.setAttribute('aria-expanded', 'false');
    p.back.inert = true;
    p.front.inert = false;
    if (openBox === box) openBox = null;
    if (location.hash === '#' + box.id) history.replaceState(null, '', location.pathname + location.search);
    if (returnFocus) p.turn.focus({ preventScroll: true });
  }

  boxes.forEach(box => {
    const p = parts(box);
    p.turn.addEventListener('click', () => open(box));
    box.querySelector('.back-btn').addEventListener('click', () => close(box));
    const play = box.querySelector('.play');
    if (play) play.addEventListener('click', () => {
      if (!played.includes(box.id)) {
        played.push(box.id);
        store.set('khel.played', JSON.stringify(played));
      }
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && openBox) close(openBox);
  });
  document.addEventListener('click', e => {
    if (openBox && !openBox.contains(e.target) && !e.target.closest('.tools')) close(openBox, false);
  });

  /* ---- pick for me ---- */
  const dice = document.getElementById('dice');
  dice.addEventListener('click', () => {
    const choices = boxes.filter(b => !b.classList.contains('soon') && b !== openBox);
    const pick = choices[Math.floor(Math.random() * choices.length)];
    if (openBox) close(openBox, false);
    dice.classList.add('rolling');
    setTimeout(() => dice.classList.remove('rolling'), 500);
    pick.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center', inline: 'center' });
    if (reduceMotion.matches) { open(pick); return; }
    afterScroll(() => open(pick));
  });

  // Turn the box over once scrolling has settled (page and shelf), not at a fixed guess,
  // so the flip never starts while the box is still sliding into view.
  function afterScroll(fn) {
    let quiet, done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(quiet); clearTimeout(cap);
      document.removeEventListener('scroll', onScroll, true);
      fn();
    };
    const onScroll = () => { clearTimeout(quiet); quiet = setTimeout(finish, 90); };
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    quiet = setTimeout(finish, 140);        // already in view: nothing scrolls
    const cap = setTimeout(finish, 1200);   // never wait longer than this
  }

  /* ---- a shared link like /#mol-molai opens that box ---- */
  const fromHash = location.hash && document.getElementById(location.hash.slice(1));
  if (fromHash && fromHash.classList.contains('box')) {
    fromHash.scrollIntoView({ block: 'center', inline: 'center' });
    open(fromHash);
  }
})();
