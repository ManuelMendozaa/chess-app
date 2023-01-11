import { IBoard, IPiece, IPieceType, ISquare, PieceNameEnum } from '../models';

const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const rows = [8, 7, 6, 5, 4, 3, 2, 1];
const pieceTypes: IPieceType[] = [
  { name: 'pawn', value: 1 },
  { name: 'knight', value: 3 },
  { name: 'bishop', value: 3 },
  { name: 'rook', value: 5 },
  { name: 'queen', value: 9 },
  { name: 'king', value: 0 },
];

export function generateBoard() {
  // Create a 2D array of squares 8x8
  const squares: ISquare[][] = rows.map((row) => {
    return columns.map((column) => {
      const code = column + row;
      const piece = generatePiece(code);
      return {
        code,
        ...(piece ? { piece } : {}),
        image: piece ? piece.image : 'empty-square',
      };
    });
  });

  // Create a board object
  const board: IBoard = {
    squares,
    status: 'default',
    turn: 'white',
    castles: [true, true, true, true],
    check: false,
    checkmate: false,
    enPassant: { active: false, coords: [] }
  };
  // Return board
  return board;
}

function generatePiece(code: string): IPiece | null {
  // Check if code is valid for a piece
  if ([3, 4, 5, 6].includes(Number(code[1]))) return null;
  // Get piece color based on row
  const color = [1, 2].includes(Number(code[1])) ? 'white' : 'black';
  // Get piece type based on column
  const pieceType = getPieceType(code);
  // Create piece object and return it
  return {
    _id: `${color}-${pieceType.name}-${code}`,
    color,
    pieceType,
    initSquare: code,
    currentSquare: code,
    active: true,
    image: `${color}-${pieceType.name}`,
  };
}

function getPieceType(code: string) {
  if ([2, 7].includes(Number(code[1]))) return pieceTypes[0];

  const column = code[0];
  switch (column) {
    case 'a':
    case 'h':
      return pieceTypes[3];
    case 'b':
    case 'g':
      return pieceTypes[1];
    case 'c':
    case 'f':
      return pieceTypes[2];
    case 'd':
      return pieceTypes[4];
    case 'e':
      return pieceTypes[5];
  }

  return pieceTypes[0];
}

// Board queries
export function getKingCoords(squares: ISquare[][], color: string): number[] {
  const square = squares
    .flat()
    .find(
      (s) => s.piece?.pieceType?.name === 'king' && s.piece?.color === color
    ) as ISquare;
  return codeToCoords(square.code);
}

export function getPiecesByColor(
  squares: ISquare[][],
  color: string
): IPiece[] {
  return squares
    .flat()
    .map((square) => {
      if (square.piece?.color === color) return square.piece;
      return null;
    })
    .filter((piece) => !!piece) as IPiece[];
}

// Aux functions
export function codeToCoords(code: string): number[] {
  const row = code[1];
  const column = code[0];
  const rowNumber = rows.indexOf(Number(row));
  const colNumber = columns.indexOf(column);
  return [rowNumber, colNumber];
}

export function coordsToCode(coords: number[]): string {
  const row = rows[coords[0]];
  const column = columns[coords[1]];
  return column + row;
}
