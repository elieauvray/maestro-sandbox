import {
  newGame,
  playMove,
  getStatus,
  createScores,
  recordResult,
  resetScores,
  normalizeScores,
} from './game.js';

const STORAGE_KEY = 'tictactoe.scores';

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const restartEl = document.getElementById('restart');
const resetScoresEl = document.getElementById('reset-scores');
const scoreEls = {
  x: document.getElementById('score-x'),
  o: document.getElementById('score-o'),
  draws: document.getElementById('score-draws'),
};
const cells = Array.from(boardEl.querySelectorAll('.cell'));

let state = newGame();
let scores = loadScores();

function loadScores() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? createScores() : normalizeScores(JSON.parse(raw));
  } catch {
    // Storage unavailable or content is not valid JSON: start from zero.
    return createScores();
  }
}

function saveScores() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // Storage unavailable (private mode, quota): the scores stay in memory.
  }
}

function cellLabel(index) {
  const row = Math.floor(index / 3) + 1;
  const column = (index % 3) + 1;
  const content = state.board[index] ?? 'empty';
  return `Row ${row}, column ${column}, ${content}`;
}

function render() {
  cells.forEach((cell, index) => {
    cell.textContent = state.board[index] ?? '';
    cell.setAttribute('aria-label', cellLabel(index));
    cell.classList.toggle('cell--playable', !state.over && state.board[index] === null);
    cell.classList.toggle('win', state.winningLine !== null && state.winningLine.includes(index));
  });
  statusEl.textContent = getStatus(state);
  scoreEls.x.textContent = String(scores.x);
  scoreEls.o.textContent = String(scores.o);
  scoreEls.draws.textContent = String(scores.draws);
}

boardEl.addEventListener('click', (event) => {
  const cell = event.target.closest('.cell');
  if (!cell || !boardEl.contains(cell)) return;
  const next = playMove(state, Number(cell.dataset.index));
  if (next === state) return;
  const finished = next.over && !state.over;
  state = next;
  if (finished) {
    scores = recordResult(scores, state);
    saveScores();
  }
  render();
});

restartEl.addEventListener('click', () => {
  state = newGame();
  render();
});

resetScoresEl.addEventListener('click', () => {
  scores = resetScores();
  saveScores();
  render();
});

render();
