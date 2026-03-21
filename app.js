// Flashcard app — add new categories by updating data/index.json
// and adding a matching data/<id>.json file.

const INDEX_URL = 'data/index.json';

let fullDeck = [];   // all cards for the current category
let deck = [];       // active (filtered) deck
let currentIndex = 0;
let isFlipped = false;
let availableGroups = [];
let selectedGroups = new Set();
let availableModes = [];  // mode objects from deck JSON (optional)
let currentMode = null;   // active mode object, or null for standard decks

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
const groupFilter = document.getElementById('group-filter');
const modeSelector = document.getElementById('mode-selector');
const frontNote = document.getElementById('card-front-note');

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
  availableModes = data.modes ?? [];
  currentMode = availableModes[0] ?? null;
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

function buildActiveDeck() {
  if (availableGroups.length === 0 || selectedGroups.size === availableGroups.length) {
    return [...fullDeck];
  }
  return fullDeck.filter(c => selectedGroups.has(c.group));
}

// --- Mode selector UI ---

function renderModeSelector() {
  modeSelector.innerHTML = '';
  if (availableModes.length === 0) {
    modeSelector.classList.add('hidden');
    return;
  }

  modeSelector.classList.remove('hidden');

  availableModes.forEach(mode => {
    const btn = document.createElement('button');
    btn.textContent = mode.label;
    btn.className = 'group-btn' + (currentMode?.id === mode.id ? ' active' : '');
    btn.addEventListener('click', () => {
      currentMode = mode;
      showCard();
      renderModeSelector();
    });
    modeSelector.appendChild(btn);
  });
}

// --- Group filter UI ---

function renderGroupFilter() {
  groupFilter.innerHTML = '';
  if (availableGroups.length === 0) {
    groupFilter.classList.add('hidden');
    return;
  }

  groupFilter.classList.remove('hidden');

  // "All" toggle
  const allBtn = document.createElement('button');
  allBtn.textContent = 'All';
  allBtn.className = 'group-btn' + (selectedGroups.size === availableGroups.length ? ' active' : '');
  allBtn.addEventListener('click', () => {
    if (selectedGroups.size === availableGroups.length) {
      selectedGroups.clear();
    } else {
      availableGroups.forEach(g => selectedGroups.add(g));
    }
    applyGroupFilter();
  });
  groupFilter.appendChild(allBtn);

  availableGroups.forEach(group => {
    const btn = document.createElement('button');
    btn.textContent = group;
    btn.className = 'group-btn' + (selectedGroups.has(group) ? ' active' : '');
    btn.addEventListener('click', () => {
      if (selectedGroups.has(group)) {
        // Don't deselect the last group
        if (selectedGroups.size > 1) selectedGroups.delete(group);
      } else {
        selectedGroups.add(group);
      }
      applyGroupFilter();
    });
    groupFilter.appendChild(btn);
  });
}

function applyGroupFilter() {
  deck = buildActiveDeck();
  currentIndex = 0;
  showCard();
  renderGroupFilter();
}

// --- Render ---

function showCard() {
  if (deck.length === 0) {
    frontText.textContent = '';
    backText.textContent = '';
    frontNote.textContent = '';
    progress.textContent = '0 / 0';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    unflip();
    return;
  }
  const card_data = deck[currentIndex];
  frontText.textContent = currentMode ? card_data[currentMode.front] : card_data.front;
  backText.textContent  = currentMode ? card_data[currentMode.back]  : card_data.back;
  frontNote.textContent = (currentMode?.frontNote) ? (card_data[currentMode.frontNote] ?? '') : '';
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
  fullDeck = await loadDeck(file);
  availableGroups = [...new Set(fullDeck.map(c => c.group).filter(Boolean))];
  selectedGroups = new Set(availableGroups);
  deck = buildActiveDeck();
  currentIndex = 0;
  renderModeSelector();
  renderGroupFilter();
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
      fullDeck = await loadDeck(categories[0].file);
      availableGroups = [...new Set(fullDeck.map(c => c.group).filter(Boolean))];
      selectedGroups = new Set(availableGroups);
      deck = buildActiveDeck();
      renderModeSelector();
      renderGroupFilter();
      showCard();
    }
  } catch (err) {
    frontText.textContent = '⚠';
    backText.textContent = err.message;
    console.error(err);
  }
}

init();
