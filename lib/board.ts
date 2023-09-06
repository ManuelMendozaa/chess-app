const columns = Array.from({ length: 8 }, (_, i) => i);
const rows = Array.from({ length: 8 }, (_, i) => i);
const filters = Array.from({ length: 15 }, (_, i) => i);

// Board tensor indexes legend
// 0: white pawns positions
// 1: white knights positions
// 2: white bishops positions
// 3: white rooks positions
// 4: white queens positions
// 5: white kings positions
// 6: black pawns positions
// 7: black knights positions
// 8: black bishops positions
// 9: black rooks positions
// 10: black queens positions
// 11: black kings positions
// 12: turn (0: white, 1: black)
// 13: rooks able to castle (1s for able in the rooks' squares)
// 14: en passant (0: inactive, 1: active in the pawn's square)

export function generateBoard() {
  return rows.map((r) =>
    columns.map((c) => filters.map((f) => getTensorUnitValue(r, c, f)))
  );
}

function getTensorUnitValue(row: number, column: number, filter: number) {
  // Pieces positions
  if (filter === 0 && row === 6) return 1; // White pawn
  if (filter === 1 && row === 7 && [1, 6].includes(column)) return 1; // White knight
  if (filter === 2 && row === 7 && [2, 5].includes(column)) return 1; // White bishop
  if (filter === 3 && row === 7 && [0, 7].includes(column)) return 1; // White rook
  if (filter === 4 && row === 7 && column === 3) return 1; // White queen
  if (filter === 5 && row === 7 && column === 4) return 1; // White king

  if (filter === 6 && row === 1) return 1; // Black pawn
  if (filter === 7 && row === 0 && [1, 6].includes(column)) return 1; // Black knight
  if (filter === 8 && row === 0 && [2, 5].includes(column)) return 1; // Black bishop
  if (filter === 9 && row === 0 && [0, 7].includes(column)) return 1; // Black rook
  if (filter === 10 && row === 0 && column === 3) return 1; // Black queen
  if (filter === 11 && row === 0 && column === 4) return 1; // Black king

  if (filter === 13 && [0, 7].includes(row) && [0, 7].includes(column)) {
    return 1; // Castles
  }

  // For the turn and en passant filters, the value is always 0 along with the rest of the board
  return 0;
}

export function updateBoard(
  position: (1 | 0)[][][],
  validMoves: any[],
  initSquare: number[],
  targetSquare: number[]
) {
  // Get piece filter
  const filter = position[initSquare[0]][initSquare[1]].findIndex(
    (f) => f === 1
  );
  if (filter > 11) return { position, valid: false };

  // Get color
  const color = position[0][0][12];

  // Decompose move
  const [initRow, initCol] = initSquare;
  const [targetRow, targetCol] = targetSquare;

  const isValidMove = getMoveValidity(
    validMoves,
    color,
    filter,
    initSquare,
    targetSquare
  );

  if (!isValidMove) return { position, valid: false };

  // Generate new board
  let newPosition = position.map((row) => row.map((col) => [...col]));

  const pawnMove = [0, 6].includes(filter);
  const kingMove = [5, 11].includes(filter);
  const rookMove = [3, 9].includes(filter);
  const pawnDirection = color === 0 ? 1 : -1;

  // Check for special moves
  const castle = kingMove && Math.abs(initCol - targetCol) === 2;
  const enPassant =
    pawnMove &&
    targetCol !== initCol &&
    position[targetRow + pawnDirection][targetCol][14];

  // Promotion
  let newFilter = filter;
  if (pawnMove && [0, 7].includes(targetRow)) {
    const randomPiece = Math.floor(Math.random() * 4) + 1;
    newFilter = color === 0 ? randomPiece : randomPiece + 6;
  }

  // Update init square
  newPosition[initRow][initCol][filter] = 0;
  // Update end square
  newPosition[targetRow][targetCol] = newPosition[targetRow][targetCol].map(
    (f, i) => (i < 12 ? 0 : f)
  );
  newPosition[targetRow][targetCol][newFilter] = 1;

  if (enPassant) {
    const rivalPawnFilter = color === 0 ? 6 : 0;
    newPosition[targetRow + pawnDirection][targetCol][rivalPawnFilter] = 0;
  }

  if (castle) {
    const rookCol = targetCol === 6 ? 7 : 0;
    const rookFilter = color === 0 ? 3 : 9;
    const rookDirection = targetCol === 6 ? -1 : 1;
    newPosition[targetRow][rookCol][rookFilter] = 0;
    newPosition[targetRow][targetCol + rookDirection][rookFilter] = 1;
  }

  // Update turn and en passant
  newPosition = newPosition.map((row) =>
    row.map((col) =>
      col.map((f, filterIndex) => {
        if (filterIndex === 12) return f === 0 ? 1 : 0;
        if (filterIndex === 14) return 0;
        return f;
      })
    )
  );

  // Update castles if king or rook moves
  if (kingMove || rookMove) {
    const rank = color === 0 ? 7 : 0;

    if (kingMove) {
      if (newPosition[rank][0][13]) newPosition[rank][0][13] = 0;
      if (newPosition[rank][7][13]) newPosition[rank][7][13] = 0;
    }

    if (rookMove) {
      if (initCol === 0 && newPosition[rank][0][13]) {
        newPosition[rank][0][13] = 0;
      }
      if (initCol === 7 && newPosition[rank][7][13]) {
        newPosition[rank][7][13] = 0;
      }
    }
  }

  // Update en passant opportunity
  if ([0, 6].includes(filter) && Math.abs(initRow - targetRow) === 2) {
    const rivalPawnsFilter = color === 0 ? 6 : 0;
    if (targetCol > 0 && position[targetRow][targetCol - 1][rivalPawnsFilter]) {
      newPosition[targetRow][targetCol][14] = 1;
    } else if (
      targetCol < 7 &&
      position[targetRow][targetCol + 1][rivalPawnsFilter]
    ) {
      newPosition[targetRow][targetCol][14] = 1;
    }
  }

  return { position: newPosition, valid: true };
}

export function getMoveValidity(
  validMoves: any[],
  color: 0 | 1,
  pieceFilter: number,
  initSquare: number[],
  targetSquare: number[]
) {
  if (pieceFilter > 11) return false;
  if (pieceFilter < 6 && color === 1) return false;
  if (pieceFilter > 5 && color === 0) return false;

  const [initRow, initCol] = initSquare;
  const [targetRow, targetCol] = targetSquare;

  const isValidMove = validMoves.some(
    (move) =>
      move.filter === pieceFilter &&
      move.initSquare[0] === initRow &&
      move.initSquare[1] === initCol &&
      move.targetSquare[0] === targetRow &&
      move.targetSquare[1] === targetCol &&
      !move.protective
  );

  return isValidMove;
}
