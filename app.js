// Two-panel GIF bot (v3f): Left has before/after GIFs; Right shows before -> answer -> auto-return.
const $ = (sel) => document.querySelector(sel);
const inputEl = $('#input');
const formEl = $('#chatForm');
const leftEl = $('#leftImage');
const rightEl = $('#rightImage');

let GIFS = null;
let resetTimer = null;
const AUTO_RESET_MS = 5000;

// Bright SVG fallback
const FALLBACK_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#000" font-family="Arial,Helvetica,sans-serif" font-size="36">
    Placeholder (image missing)
  </text>
</svg>`);

(async function init(){
  try {
    GIFS = await fetch('./data/gifs.json').then(r=>r.json());
    // Init left/right states
    setLeft('before');
    loadImage(rightEl, GIFS?.before?.src || '', 'before.gif');
  } catch (e) {
    console.error('Failed to load gifs.json', e);
    leftEl.src = FALLBACK_SVG;
    rightEl.src = FALLBACK_SVG;
  }
})();

function setLeft(phase){
  const src = phase === 'after' ? GIFS?.left?.after : GIFS?.left?.before;
  loadImage(leftEl, src || '', `left_${phase}.gif`);
}

function loadImage(imgEl, src, label='image'){
  if (!src) { imgEl.src = FALLBACK_SVG; return; }
  const test = new Image();
  test.onload = () => { imgEl.src = src; };
  test.onerror = () => {
    console.error('Failed to load', label, 'at', src);
    imgEl.src = FALLBACK_SVG;
  };
  test.src = src + (src.includes('?') ? '&' : '?') + 'cachebust=' + Date.now();
}

formEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = (inputEl.value || '').trim();
  if (!text) return;
  inputEl.value = '';
  respond(text);
});

function respond(raw){
  const q = normalize(raw);
  const intent = detectIntent(q);
  switch (intent) {
    case 'favorite_color': showAnswer('favorite_color'); break;
    case 'favorite_animal': showAnswer('favorite_animal'); break;
    case 'favorite_food': showAnswer('favorite_food'); break;
    case 'whats_in_bag': showAnswer('whats_in_bag'); break;
    default: showAnswer('secret');
  }
}

function detectIntent(q){
  if ( /(favou?rite|favorite)\s+colou?r/.test(q) || /colou?r/.test(q) && /(fav|like)/.test(q) ) return 'favorite_color';
  if ( /(favou?rite|favorite)\s+animal/.test(q) || /(what)\s+animal\s+(does|do)\s*(she|fiona)\s+like/.test(q) ) return 'favorite_animal';
  if ( /(favou?rite|favorite)\s+food/.test(q) || /(what|which)\s+food\s+(does|do)\s*(she|fiona)\s+like/.test(q) ) return 'favorite_food';
  if ( /(what'?s|what\s+is)\s+in\s+her\s+bag/.test(q) || /(bag)\s*(contents|inside)/.test(q) ) return 'whats_in_bag';
  return 'secret';
}

function normalize(s){ return s.toLowerCase().replace(/\s+/g,' ').trim(); }

function showAnswer(key){
  const cfg = GIFS?.answers?.[key]; if (!cfg?.src) return;
  // Right panel -> answer
  const url = new URL(cfg.src, window.location.href);
  url.searchParams.set('t', Date.now());
  loadImage(rightEl, url.toString(), key);

  // Left panel -> after
  setLeft('after');

  // auto-return to before GIFs
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    loadImage(rightEl, GIFS?.before?.src || '', 'before.gif');
    setLeft('before');
  }, AUTO_RESET_MS);
}
