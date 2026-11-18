import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WINNING_LINES,
  newGame,
  playMove,
  getWinner,
  isGameOver,
  getStatus,
} from '../public/js/game.js';

// Play a sequence of cell indexes, starting from a new game.
function play(...moves) {
  return moves.reduce((state, index) => playMove(state, index), newGame());
}

test('new game: empty board, X to play, not over', () => {
  const state = newGame();
  assert.deepEqual(state.board, Array(9).fill(null));
  assert.equal(state.turn, 'X');
  assert.equal(state.winner, null);
  assert.equal(state.draw, false);
  assert.equal(isGameOver(state), false);
  assert.equal(getStatus(state), 'X to play');
});

test('R1: X starts and turns alternate', () => {
  const s1 = playMove(newGame(), 0);
  assert.equal(s1.board[0], 'X');
  assert.equal(s1.turn, 'O');
  assert.equal(getStatus(s1), 'O to play');
  const s2 = playMove(s1, 1);
  assert.equal(s2.board[1], 'O');
  assert.equal(s2.turn, 'X');
  const s3 = playMove(s2, 2);
  assert.equal(s3.board[2], 'X');
  assert.equal(s3.turn, 'O');
});

test('playMove does not mutate the previous state', () => {
  const before = newGame();
  playMove(before, 4);
  assert.deepEqual(before.board, Array(9).fill(null));
  assert.equal(before.turn, 'X');
});

test('R2: occupied cell does nothing', () => {
  const state = play(4);
  const after = playMove(state, 4);
  assert.deepEqual(after.board, state.board);
  assert.equal(after.turn, state.turn);
  assert.equal(after.turn, 'O');
});

test('invalid indexes do nothing', () => {
  const state = newGame();
  for (const index of [-1, 9, 1.5, NaN, undefined, null, '3']) {
    const after = playMove(state, index);
    assert.deepEqual(after.board, state.board);
    assert.equal(after.turn, 'X');
  }
});

test('R3: all 8 winning lines are listed', () => {
  assert.equal(WINNING_LINES.length, 8);
});

for (const line of [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]) {
  test(`R3: X wins on line ${line.join('-')}`, () => {
    // O plays cells outside the line and never completes a line itself.
    const others = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => !line.includes(i));
    const state = play(line[0], others[0], line[1], others[1], line[2]);
    assert.equal(state.winner, 'X');
    assert.deepEqual(state.winningLine, line);
    assert.equal(state.draw, false);
    assert.equal(isGameOver(state), true);
    assert.equal(getStatus(state), 'X wins');
    assert.equal(getWinner(state.board).winner, 'X');
  });
}

test('R3: O can win', () => {
  // X: 0, 1, 8 ; O: 3, 4, 5
  const state = play(0, 3, 1, 4, 8, 5);
  assert.equal(state.winner, 'O');
  assert.deepEqual(state.winningLine, [3, 4, 5]);
  assert.equal(getStatus(state), 'O wins');
});

test('R4: full board without a winner is a draw', () => {
  // X O X
  // X O O
  // O X X
  const state = play(0, 1, 2, 4, 3, 5, 7, 6, 8);
  assert.equal(state.winner, null);
  assert.equal(state.draw, true);
  assert.equal(isGameOver(state), true);
  assert.equal(getStatus(state), 'Draw');
  assert.ok(state.board.every((cell) => cell !== null));
});

test('a win on the last move is a win, not a draw', () => {
  // X O X
  // O X O
  // O X X  -> X completes 0-4-8 with the ninth move
  const state = play(0, 1, 2, 3, 4, 5, 7, 6, 8);
  assert.equal(state.winner, 'X');
  assert.equal(state.draw, false);
  assert.equal(getStatus(state), 'X wins');
});

test('R5: no move after a win', () => {
  const won = play(0, 3, 1, 4, 2);
  const after = playMove(won, 8);
  assert.deepEqual(after.board, won.board);
  assert.equal(after.winner, 'X');
  assert.equal(after.turn, won.turn);
});

test('R5: no move after a draw', () => {
  const drawn = play(0, 1, 2, 4, 3, 5, 7, 6, 8);
  const after = playMove(drawn, 0);
  assert.deepEqual(after.board, drawn.board);
  assert.equal(after.draw, true);
});

test('R6: a new game after play clears the board and X plays first', () => {
  const played = play(0, 3, 1, 4, 2);
  assert.equal(played.over, true);
  const fresh = newGame();
  assert.deepEqual(fresh.board, Array(9).fill(null));
  assert.equal(fresh.turn, 'X');
  assert.equal(fresh.over, false);
  assert.equal(playMove(fresh, 0).board[0], 'X');
});
