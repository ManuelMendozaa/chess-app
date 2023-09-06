type KeySquare = {
  square: number[];
  isPiece?: boolean;
  isDefended?: boolean;
  threatsKing?: boolean;
  blocks?: boolean;
};

export function validateCheck(
  validMoves: any[],
  kingSquare: number[],
  kingColor: 0 | 1
) {
  const checkMoves = filterByTarget(validMoves, kingSquare).filter(
    (m) => !m.protective
  );

  const check = checkMoves.length > 0;
  if (!check) return { check, defensiveMoves: [] };

  let ownFilters = kingColor === 0 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];
  if (checkMoves.length > 1) ownFilters = kingColor === 0 ? [5] : [11];

  const keySquares = getKeySquares(checkMoves, validMoves, ownFilters);
  const defensiveMoves = getDefensiveMoves(validMoves, keySquares, ownFilters);
  return { check, defensiveMoves };
}

function filterByTarget(validMoves: any[], target: number[]) {
  const checkMoves = validMoves.filter(
    (move) =>
      move.targetSquare[0] === target[0] && move.targetSquare[1] === target[1]
  );
  return checkMoves;
}

function getDefensiveMoves(
  validMoves: any[],
  keySquares: KeySquare[],
  ownFilters: number[]
) {
  const defensiveMoves = validMoves.filter((move) => {
    if (!ownFilters.includes(move.filter)) return;

    const [targetRow, targetCol] = move.targetSquare;
    const keySquare = keySquares.find(
      (s) => targetRow === s.square[0] && targetCol === s.square[1]
    );

    // King case
    if (move.filter === 5 || move.filter === 11) {
      if (keySquare) {
        return keySquare.isPiece && !keySquare.isDefended;
      }
      return true;
    }

    return (keySquare?.isPiece && keySquare?.threatsKing) || keySquare?.blocks;
  });
  return defensiveMoves;
}

export function getKeySquares(
  checkMoves: any[],
  validMoves: any[],
  ownFilters: number[]
) {
  const keySquares: KeySquare[] = [];

  checkMoves.forEach((move) => {
    keySquares.push({
      square: move.initSquare,
      isPiece: true,
      isDefended:
        filterByTarget(
          validMoves.filter((m) => !ownFilters.includes(m.filter)),
          move.initSquare
        ).length > 1,
      threatsKing: true,
    });

    if ([0, 1, 6, 7].includes(move.filter)) return;

    const [initRow, initCol] = move.initSquare;
    const [targetRow, targetCol] = move.targetSquare;

    const rowDiff = targetRow - initRow;
    const colDiff = targetCol - initCol;
    const rowDirection = rowDiff / (Math.abs(rowDiff) || 1);
    const colDirection = colDiff / (Math.abs(colDiff) || 1);

    let blocks = true;
    let row: number = initRow + rowDirection;
    let col: number = initCol + colDirection;
    while (row >= 0 && row < 8 && col >= 0 && col < 8) {
      if (row === targetRow && col === targetCol) blocks = false;
      keySquares.push({ square: [row, col], threatsKing: true, blocks });
      row += rowDirection;
      col += colDirection;
    }
  }, []);

  validMoves.forEach((move) => {
    if (ownFilters.includes(move.filter)) return;
    const [row, col] = move.targetSquare;

    // Pawn captures
    if (move.filter === 0 || move.filter === 6) {
      if (Math.abs(move.initSquare[0] - row) === 2) return;
      if (col > 0) {
        const exists = keySquares.some(
          (s) => s.square[0] === row && s.square[1] === col - 1
        );
        if (!exists) {
          keySquares.push({ square: [row, col - 1], threatsKing: false });
        }
      }
      if (col < 7) {
        const exists = keySquares.some(
          (s) => s.square[0] === row && s.square[1] === col + 1
        );
        if (!exists) {
          keySquares.push({ square: [row, col + 1], threatsKing: false });
        }
      }
      return;
    }

    const exists = keySquares.some(
      (s) => s.square[0] === row && s.square[1] === col
    );
    if (exists) return;
    keySquares.push({ square: [row, col], threatsKing: false });
  });

  return keySquares;
}
