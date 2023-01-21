import {
  codeToCoords,
  coordsToCode,
  getKingCoords,
  getPiecesByColor,
} from './board';
import { IEnPassant, IMove, IPiece, ISquare } from '../models';
import { updatePieceOnBoard } from './moves';

type EnumMovementType =
  | 'capture'
  | 'enPassant'
  | 'castle'
  | 'promotion'
  | 'doubleStep';

interface MovementType {
  types: EnumMovementType[] | null;
  valid: boolean;
}

const defaultMovement = { types: [], valid: true };
const wrongMovement = { types: [], valid: false };

export function validateMove(move: IMove): MovementType {
  // Destructure the move
  const { board, piece, fromIndexed, toIndexed } = move;
  // Destructure the board to get the squares
  const { squares } = board;
  // Extract move coordinates
  const [fromRow, fromCol] = fromIndexed;
  const [toRow, toCol] = toIndexed;
  const coords: number[] = [fromRow, fromCol, toRow, toCol];

  // Get piece name and color
  const pieceName: string = piece.pieceType.name;
  const color: string = piece.color;

  // Case: wrong turn
  if (board.turn !== color) return wrongMovement;

  // Validate move and get types
  const { types, valid } = validateMovement(
    pieceName,
    squares,
    coords,
    color === 'white' ? board.castles.slice(0, 2) : board.castles.slice(2, 4),
    move.enPassantCapture
  );

  // Case: invalid castle
  if (types?.includes('castle') && board.check) return { types, valid: false };

  // Return movement type
  return { types, valid };
}

function validateMovement(
  pieceName: string,
  squares: ISquare[][],
  coords: number[],
  castles: boolean[] = [],
  enPassant: IEnPassant = { active: false, coords: [] }
): MovementType {
  // General rules
  const piece = squares[coords[0]][coords[1]].piece;
  const capturedPiece = squares[coords[2]][coords[3]].piece;

  // Cannibalism is not good
  if (capturedPiece?.color === piece?.color) return wrongMovement;

  // Check cases for each type of piece
  if (pieceName === 'pawn') return verifyPawnMove(squares, coords, enPassant);
  if (pieceName === 'knight') return verifyKnightMove(coords);
  if (pieceName === 'bishop') return verifyBishopMove(squares, coords);
  if (pieceName === 'rook') return verifyRookMove(squares, coords);
  if (pieceName === 'queen') return verifyQueenMove(squares, coords);
  if (pieceName === 'king') return verifyKingMove(squares, coords, castles);
  return wrongMovement;
}

// Pieces rules
function verifyPawnMove(
  squares: ISquare[][],
  [fromRow, fromCol, toRow, toCol]: number[],
  enPassant: IEnPassant
): MovementType {
  // Extract color
  const color: string = squares?.[fromRow]?.[fromCol]?.piece?.color ?? '';
  const white = color === 'white';

  // Check if it's a simple capture
  const capture: boolean = !!squares[toRow][toCol].piece;
  // Check if it's an en passant capture
  const enPassantCapture =
    !!squares?.[toRow + (white ? 1 : -1)]?.[toCol]?.piece &&
    enPassant?.active &&
    Math.abs(enPassant?.coords?.[0] - toRow) === 1 &&
    enPassant?.coords?.[1] === toCol;

  if (enPassant.active) {
    console.log(enPassant);
    console.log(squares?.[toRow - 1]?.[toCol]?.piece);
    console.log(Math.abs(enPassant?.coords?.[0] - toRow));
    console.log(enPassant?.coords?.[1] === toCol);
  }

  const columnDelta: number = Math.abs(fromCol - toCol);
  const rowDelta: number = white ? fromRow - toRow : toRow - fromRow;

  // Case: wrong capture
  if (capture && (columnDelta !== 1 || rowDelta !== 1)) return wrongMovement;
  // Case: valid simple capture
  if (capture && columnDelta === 1 && rowDelta === 1) return defaultMovement;
  // Case: valid en passant capture
  if (enPassantCapture && columnDelta === 1 && rowDelta === 1) {
    return { types: ['enPassant'], valid: true };
  }
  // Case: first move forward
  const firstMove: boolean = white ? fromRow === 6 : fromRow === 1;
  if (rowDelta === 2 && columnDelta === 0 && firstMove) {
    return { types: ['doubleStep'], valid: true };
  }
  // Case: forward move
  if (rowDelta === 1 && columnDelta === 0) return defaultMovement;
  // Case: en passant
  // TODO: implement en passant
  return wrongMovement;
}

function verifyKnightMove([
  fromRow,
  fromCol,
  toRow,
  toCol,
]: number[]): MovementType {
  const rowDelta = Math.abs(fromRow - toRow);
  const colDelta = Math.abs(fromCol - toCol);
  return {
    types: null,
    valid:
      (rowDelta === 2 && colDelta === 1) || (rowDelta === 1 && colDelta === 2),
  };
}

function verifyBishopMove(
  squares: ISquare[][],
  [fromRow, fromCol, toRow, toCol]: number[]
): MovementType {
  // Get the deltas
  const rowDelta = Math.abs(fromRow - toRow);
  const colDelta = Math.abs(fromCol - toCol);

  // Case: not a diagonal move
  if (rowDelta !== colDelta) return wrongMovement;

  // Case: blocked path
  const rowDirection = fromRow < toRow ? 1 : -1;
  const colDirection = fromCol < toCol ? 1 : -1;
  const valid = Array.from({ length: rowDelta }).reduce((acc, _, i) => {
    // If already false, nothing to do
    if (!acc) return false;
    // Advance one square diagonally
    const row = fromRow + (i + 1) * rowDirection;
    const col = fromCol + (i + 1) * colDirection;
    // Check if there's a piece in the way
    const piece = squares[row][col].piece;
    // If there's no piece, return true
    if (!piece) return true;
    // Otherwise, check capture
    if (i === rowDelta - 1) return true;
    return false;
  }, true) as boolean;
  return { types: [], valid };
}

function verifyRookMove(
  squares: ISquare[][],
  [fromRow, fromCol, toRow, toCol]: number[]
): MovementType {
  // Get the deltas
  const rowDelta = Math.abs(fromRow - toRow);
  const colDelta = Math.abs(fromCol - toCol);

  // Case: not a horizontal or vertical move
  if (rowDelta !== 0 && colDelta !== 0) return wrongMovement;

  // Case: blocked path
  const rowDirection = (fromRow < toRow ? 1 : -1) * (rowDelta === 0 ? 0 : 1);
  const colDirection = (fromCol < toCol ? 1 : -1) * (colDelta === 0 ? 0 : 1);
  const delta = rowDelta === 0 ? colDelta : rowDelta;
  const valid = Array.from({ length: delta }).reduce((acc, _, i) => {
    // If already false, nothing to do
    if (!acc) return false;
    // Advance one square either horizontally or vertically
    const row = fromRow + (i + 1) * rowDirection;
    const col = fromCol + (i + 1) * colDirection;
    // Check if there's a piece in the way
    const piece = squares[row][col].piece;
    // If there's no piece, return true
    if (!piece) return true;
    // Otherwise, check capture
    if (i === delta - 1) return true;
    return false;
  }, true) as boolean;
  return { types: [], valid };
}

function verifyQueenMove(
  squares: ISquare[][],
  [fromRow, fromCol, toRow, toCol]: number[]
): MovementType {
  const valid =
    verifyBishopMove(squares, [fromRow, fromCol, toRow, toCol]).valid ||
    verifyRookMove(squares, [fromRow, fromCol, toRow, toCol]).valid;
  return { types: [], valid };
}

function verifyKingMove(
  squares: ISquare[][],
  [fromRow, fromCol, toRow, toCol]: number[],
  castles: boolean[] = []
): MovementType {
  const rowDelta = Math.abs(fromRow - toRow);
  const colDelta = Math.abs(fromCol - toCol);

  // Case: valid castling right
  if (castles[0] && !rowDelta && toCol - fromCol === 2) {
    return {
      types: ['castle'],
      valid: verifyRookMove(squares, [fromRow, fromCol, toRow, toCol]).valid,
    };
  }
  // Case: valid castling left
  if (castles[1] && !rowDelta && fromCol - toCol === 2) {
    return {
      types: ['castle'],
      valid: verifyRookMove(squares, [fromRow, fromCol, toRow, toCol]).valid,
    };
  }
  // Case: can't move more than one square
  if (rowDelta > 1 || colDelta > 1) return wrongMovement;

  return defaultMovement;
}

/**
 * Check if the color provided is in check.
 * @param {ISquare[][]} squares The current position of the pieces
 * @param {string} color The color of the player to validate is it's in check
 * @returns {{ threats: IPiece[]; isCheck: boolean }} An object with the list of threats and if the player is in check
 */
export function validateCheck(
  squares: ISquare[][],
  color: string
): { threats: IPiece[]; isCheck: boolean } {
  // Get king position
  const kingCoords = getKingCoords(squares, color);
  // Get opponent pieces
  const opponentColor = color === 'white' ? 'black' : 'white';
  const opponentPieces = getPiecesByColor(squares, opponentColor);
  // Check if any opponent piece can capture the king
  const threats = opponentPieces.filter((piece: IPiece) => {
    // Get piece name
    const pieceName: string = piece.pieceType.name;

    // King can't capture king
    if (pieceName === 'king') return false;
    // Get piece position
    const pieceCoords: number[] = codeToCoords(piece.currentSquare);
    // Check if the piece can capture the king
    return validateMovement(pieceName, squares, [...pieceCoords, ...kingCoords])
      .valid;
  });
  return { threats, isCheck: threats.length > 0 };
}

/**
 * Check if the color provided is in checkmate.
 * @param {ISquare[][]} squares The current position of the pieces
 * @param {string} color The color of the player to validate is it's in checkmate
 * @param {IPiece[]} threats The list of threats to the king
 * @returns {boolean} True if the player is in checkmate, false otherwise
 */
export function validateCheckmate(
  squares: ISquare[][],
  color: string,
  threats: IPiece[]
): boolean {
  // Get king position
  const kingCoords = getKingCoords(squares, color);
  // Get opponent pieces
  const pieces = getPiecesByColor(squares, color);

  // Get key squares
  const keySquares = getKeySquares(kingCoords, threats);

  // Check if any piece can protect the king
  const defenses = pieces.some((piece: IPiece) => {
    // Get piece name
    const pieceName: string = piece.pieceType.name;
    // King cannot protect itself
    if (pieceName === 'king') return false;
    // Get piece position
    const pieceCoords: number[] = codeToCoords(piece.currentSquare);
    // Check if the piece can somehow defend the king either blocking or capturing the threat
    return keySquares.some((coords) => {
      const v = validateMovement(pieceName, squares, [
        ...pieceCoords,
        ...coords,
      ]).valid;
      if (v)
        console.log(
          `Coords to defend with: ${pieceName}`,
          coordsToCode(coords)
        );
      return v;
    });
  });
  // Check if the king can escape or capture the threat
  const escapes = getKingEscapes(kingCoords[0], kingCoords[1]).some(
    (coords) => {
      // Generate a copy of the squares
      const _squares = JSON.parse(JSON.stringify(squares));
      // Check if the king can move to the square
      if (
        !validateMovement('king', _squares, [...kingCoords, ...coords]).valid
      ) {
        return false;
      }
      // Update the board to analyze the new position
      updatePieceOnBoard(_squares, kingCoords, coords);
      // Check if the king is still in check
      return !validateCheck(_squares, color).isCheck;
    }
  );

  return !defenses && !escapes;
}

/**
 * Get the list of squares that are key to defend the king.
 * @param {number[]} kingCoords The king's coordinates
 * @param {IPiece[]} pieces The list of pieces that are threatening the king
 * @returns {number[][]} The list of key squares
 */
function getKeySquares(kingCoords: number[], pieces: IPiece[]): number[][] {
  // Get king position
  const [kingRow, kingCol] = kingCoords;
  // Get opponent pieces
  return pieces.reduce((acc: number[][], piece: IPiece) => {
    // Get piece name
    const pieceName: string = piece.pieceType.name;
    // Get piece coords
    const [pieceRow, pieceCol] = codeToCoords(piece.currentSquare);
    acc.push([pieceRow, pieceCol]);

    if (pieceName === 'rook') {
      return [...acc, ...linearKeySquares(kingCoords, [pieceRow, pieceCol])];
    }
    if (pieceName === 'bishop') {
      return [...acc, ...diagonalKeySquares(kingCoords, [pieceRow, pieceCol])];
    }
    if (pieceName === 'queen') {
      return [
        ...acc,
        ...(kingRow === pieceRow || kingCol === pieceCol
          ? linearKeySquares(kingCoords, [pieceRow, pieceCol])
          : diagonalKeySquares(kingCoords, [pieceRow, pieceCol])),
      ];
    }
    return acc;
  }, []);
}

/**
 * Get the list of squares that are key to defend the king
 * from a linear threat such as a rook or a queen.
 * @param {number[]} kingCoords The king's coordinates
 * @param {number[]} pieceCoords The coordinates of the piece that is threatening the king
 * @returns {number[][]} The list of squares between the king and the piece
 */
function linearKeySquares(
  kingCoords: number[],
  pieceCoords: number[]
): number[][] {
  // Extract coords for the king and the attacking piece
  const [kingRow, kingCol] = kingCoords;
  const [pieceRow, pieceCol] = pieceCoords;

  // Get delta row (same as delta column)
  const rowDelta = Math.abs(pieceRow - kingRow);
  const colDelta = Math.abs(pieceCol - kingCol);

  // Compute directions
  const rowDirection = (pieceRow < kingRow ? 1 : -1) * (rowDelta === 0 ? 0 : 1);
  const colDirection = (pieceCol < kingCol ? 1 : -1) * (colDelta === 0 ? 0 : 1);
  const delta = rowDelta === 0 ? colDelta : rowDelta;

  // Compute the squares between the king and the piece
  return Array.from({ length: delta }).reduce((acc: number[][], _, i) => {
    // Advance one square either horizontally or vertically
    const row = pieceRow + (i + 1) * rowDirection;
    const col = pieceCol + (i + 1) * colDirection;
    // Avoid adding the king square
    if (row === kingRow && col === kingCol) return acc;
    // Add square to the list
    return [...acc, [row, col]];
  }, []);
}

/**
 * Get the list of squares that are key to defend the king
 * from a diagonal threat such as a bishop or a queen.
 * @param {number[]} kingCoords The king's coordinates
 * @param {number[]} pieceCoords The coordinates of the piece that is threatening the king
 * @returns {number[][]} The list of squares between the king and the piece
 */
function diagonalKeySquares(
  kingCoords: number[],
  pieceCoords: number[]
): number[][] {
  // Extract coords for the king and the attacking piece
  const [kingRow, kingCol] = kingCoords;
  const [pieceRow, pieceCol] = pieceCoords;

  console.log(coordsToCode(kingCoords), coordsToCode(pieceCoords));

  // Get delta row (same as delta column)
  const rowDelta = Math.abs(pieceRow - kingRow);

  // Compute directions
  const rowDirection = pieceRow < kingRow ? 1 : -1;
  const colDirection = pieceCol < kingCol ? 1 : -1;

  // Compute the squares between the king and the piece
  return Array.from({ length: rowDelta }).reduce((acc: number[][], _, i) => {
    // Advance one square diagonally
    const row = pieceRow + (i + 1) * rowDirection;
    const col = pieceCol + (i + 1) * colDirection;
    // Avoid adding the king square
    if (row === kingRow && col === kingCol) return acc;
    // Add square to the list
    return [...acc, [row, col]];
  }, []);
}

/**
 * Get the list of squares that the king can move to.
 * @param {number} row The row of the king
 * @param {number} col The column of the king
 * @returns {number[][]} The list of squares that the king can escape to
 */
function getKingEscapes(row: number, col: number): number[][] {
  return [
    [row - 1, col - 1], // up left
    [row - 1, col], // up
    [row - 1, col + 1], // up right
    [row, col - 1], // left
    [row, col + 1], // right
    [row + 1, col - 1], // down left
    [row + 1, col], // down
    [row + 1, col + 1], // down right
  ].filter(([r, c]) => r >= 0 && r <= 7 && c >= 0 && c <= 7);
}
