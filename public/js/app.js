import { newGame, playMove, getStatus } from './game.js';

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const restartEl = document.getElementById('restart');
const cells = Array.from(boardEl.querySelectorAll('.cell'));

let state = newGame();

function render() {
  cells.forEach((cell, index) => {
    cell.textContent = state.board[index] ?? '';
    cell.classList.toggle('cell--playable', !state.over && state.board[index] === null);
  });
  statusEl.textContent = getStatus(state);
}

boardEl.addEventListener('click', (event) => {
  const cell = event.target.closest('.cell');
  if (!cell || !boardEl.contains(cell)) return;
  state = playMove(state, Number(cell.dataset.index));
  render();
});

restartEl.addEventListener('click', () => {
  state = newGame();
  render();
});

render();
