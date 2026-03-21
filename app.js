// Flashcard app — add new categories by updating data/index.json
// and adding a matching data/<id>.json file.

const INDEX_URL = 'data/index.json';

let deck = [];
let currentIndex = 0;
let isFlipped = false;

// DOM refs
const categorySelect = document.getElementById('category-select');
const card = document.getElementById('card');
const frontText = document.getElementById('card-front-text');
const backText = document.getElementById('card-back-text');
const progress = document.getElementById('progress');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const resetBtn = document.getElementById('reset-btn');

// --- Data loading ---

async function loadIndex() {
  const res = await fetch(INDEX_URL);
  if (!res.ok) throw new Error(`Failed to load category index: ${res.status}`);
  return res.json();
}

async function loadDeck(file) {
  const res = await fetch(file);
  if (!res.ok) throw new Error(`Failed to load deck: ${res.status}`);
  const data = await res.json();
  return data.cards;
}

// --- Deck operations ---

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Render ---

function showCard() {
  const card_data = deck[currentIndex];
  frontText.textContent = card_data.front;
  backText.textContent = card_data.back;
  progress.textContent = `${currentIndex + 1} / ${deck.length}`;
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === deck.length - 1;
  unflip();
}

function unflip() {
  isFlipped = false;
  card.classList.remove('flipped');
  card.querySelector('.card-front').setAttribute('aria-hidden', 'false');
  card.querySelector('.card-back').setAttribute('aria-hidden', 'true');
}

function flipCard() {
  isFlipped = !isFlipped;
  card.classList.toggle('flipped', isFlipped);
  card.querySelector('.card-front').setAttribute('aria-hidden', String(isFlipped));
  card.querySelector('.card-back').setAttribute('aria-hidden', String(!isFlipped));
}

// --- Navigation ---

function goNext() {
  if (currentIndex < deck.length - 1) {
    currentIndex++;
    showCard();
  }
}

function goPrev() {
  if (currentIndex > 0) {
    currentIndex--;
    showCard();
  }
}

// --- Event listeners ---

card.addEventListener('click', flipCard);
card.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard(); }
  if (e.key === 'ArrowRight') goNext();
  if (e.key === 'ArrowLeft') goPrev();
});

nextBtn.addEventListener('click', goNext);
prevBtn.addEventListener('click', goPrev);

shuffleBtn.addEventListener('click', () => {
  deck = shuffle(deck);
  currentIndex = 0;
  showCard();
});

resetBtn.addEventListener('click', () => {
  currentIndex = 0;
  showCard();
});

categorySelect.addEventListener('change', async () => {
  const selected = categorySelect.selectedOptions[0];
  const file = selected.dataset.file;
  deck = await loadDeck(file);
  currentIndex = 0;
  showCard();
});

// --- Init ---

async function init() {
  try {
    const categories = await loadIndex();
    categories.forEach(({ id, name, file }) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = name;
      opt.dataset.file = file;
      categorySelect.appendChild(opt);
    });
    if (categories.length > 0) {
      deck = await loadDeck(categories[0].file);
      showCard();
    }
  } catch (err) {
    frontText.textContent = '⚠';
    backText.textContent = err.message;
    console.error(err);
  }
}

init();
