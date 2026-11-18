// Pure TicTacToe logic. No DOM access.

export const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function newGame() {
  return {
    board: Array(9).fill(null),
    turn: 'X',
    winner: null,
    winningLine: null,
    draw: false,
    over: false,
  };
}

export function getWinner(board) {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [...line] };
    }
  }
  return null;
}

export function isGameOver(state) {
  return state.over;
}

export function playMove(state, index) {
  if (state.over) return state;
  if (!Number.isInteger(index) || index < 0 || index > 8) return state;
  if (state.board[index] !== null) return state;

  const board = [...state.board];
  board[index] = state.turn;

  const result = getWinner(board);
  const draw = result === null && board.every((cell) => cell !== null);
  const over = result !== null || draw;

  return {
    board,
    turn: over ? state.turn : state.turn === 'X' ? 'O' : 'X',
    winner: result ? result.winner : null,
    winningLine: result ? result.line : null,
    draw,
    over,
  };
}

export function getStatus(state) {
  if (state.winner) return `${state.winner} wins`;
  if (state.draw) return 'Draw';
  return `${state.turn} to play`;
}
