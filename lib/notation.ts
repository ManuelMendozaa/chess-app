const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export function getNotation(
  initSquare: number[],
  targetSquare: number[],
  pieceIndex: number,
  isCapture: boolean = false,
  isCheck: boolean = false,
  isCheckmate: boolean = false
) {
  const pieceType = getPieceType(pieceIndex);
  if (pieceType === 'king' && Math.abs(initSquare[1] - targetSquare[1]) === 2) {
    if (targetSquare[1] === 6) return 'O-O';
    if (targetSquare[1] === 2) return 'O-O-O';
  }

  let pieceNotation = pieceType !== 'pawn' ? pieceType.toUpperCase()[0] : '';
  if (pieceType === 'knight') {
    pieceNotation = 'N';
  }
  if (pieceType === 'pawn' && initSquare[1] !== targetSquare[1]) {
    pieceNotation = columns[initSquare[1]];
    isCapture = true;
  }
  const [targetRow, targetCol] = targetSquare;
  const targetSquareNotation = `${columns[targetCol]}${8 - targetRow}`;
  const captureNotation = isCapture ? 'x' : '';
  const checkNotation = isCheck ? '+' : '';
  const checkmateNotation = isCheckmate ? '#' : '';
  return `${pieceNotation}${captureNotation}${targetSquareNotation}${
    checkmateNotation || checkNotation
  }`;
}

export function getPieceType(pieceTypeIndex: number) {
  const pieceTypes = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
  if (pieceTypeIndex < 0 || pieceTypeIndex > 11) return '';
  return pieceTypes[pieceTypeIndex % 6];
}
