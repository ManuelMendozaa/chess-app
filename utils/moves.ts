import React from 'react';
import { IBoard, IMove, IPiece, ISquare } from '../models';
import { getKingCoords } from './board';
import { validateCheck, validateCheckmate, validateMove } from './rules';

function getBoardDimensions(boardElement: HTMLDivElement) {
  const minX = boardElement.offsetLeft;
  const minY = boardElement.offsetTop;
  const width = boardElement.offsetWidth;
  const height = boardElement.offsetHeight;
  const maxX = minX + width;
  const maxY = minY + height;
  return { minX, minY, maxX, maxY, width, height };
}

function getMousePositionInBoard(
  x: number,
  y: number,
  minX: number,
  minY: number,
  width: number,
  height: number
) {
  const i = Math.floor(((y - minY) / height) * 8);
  const j = Math.floor(((x - minX) / width) * 8);
  return { i, j };
}

function updatePiecePosition(piece: HTMLImageElement, x: number, y: number) {
  piece.style.position = 'absolute';
  piece.style.left = `${x - Number(piece.width) / 2}px`;
  piece.style.top = `${y - Number(piece.height) / 2}px`;
}

export function grabPiece(
  event: React.MouseEvent<HTMLDivElement>,
  boardElement: HTMLDivElement,
  piece: HTMLImageElement
) {
  // Get board dimensions
  const { minX, minY, width, height } = getBoardDimensions(boardElement);
  // Get mouse position
  const { clientX: x, clientY: y } = event;
  // Get mouse position in boardElement
  const { i, j } = getMousePositionInBoard(x, y, minX, minY, width, height);
  // Update piece position
  updatePiecePosition(piece, x, y);
  // Return the position of the piece
  return { i, j };
}

export function movePiece(
  event: React.MouseEvent<HTMLDivElement>,
  boardElement: HTMLDivElement,
  piece: HTMLImageElement
) {
  // Get board dimensions
  const { minX, minY, maxX, maxY } = getBoardDimensions(boardElement);
  // Get mouse position
  const { clientX: x, clientY: y } = event;
  // Check if the mouse is still inside the boardElement
  if (x < minX || x > maxX || y < minY || y > maxY) return;
  // Update piece position
  updatePiecePosition(piece, x, y);
}

export function dropPiece(
  event: React.MouseEvent<HTMLDivElement>,
  boardElement: HTMLDivElement,
  _board: IBoard,
  selectedPieceX: number,
  selectedPieceY: number
) {
  // Get board dimensions
  const { minX, minY, width, height } = getBoardDimensions(boardElement);
  // Get mouse position
  const { clientX: x, clientY: y } = event;
  // Get mouse position in boardElement
  const { i, j } = getMousePositionInBoard(x, y, minX, minY, width, height);

  // Check if the user moved the piece
  if (selectedPieceX === j && selectedPieceY === i) return _board;

  // Simple free movement
  const board: IBoard = JSON.parse(JSON.stringify(_board));

  // Construct the move
  const move: IMove = {
    board,
    piece: board.squares[selectedPieceY][selectedPieceX].piece as IPiece,
    fromIndexed: [selectedPieceY, selectedPieceX],
    toIndexed: [i, j],
    enPassantCapture: board.enPassant,
  };

  // If move is not valid, return the board
  const { types, valid } = validateMove(move);
  if (!valid) return _board;

  const attributes = types?.reduce((acc, type) => {
    return { ...acc, [type]: true };
  }, {}) as IMove;

  return executeMove(board, _board, { ...move, ...attributes });
}

function executeMove(board: IBoard, prevBoard: IBoard, move: IMove) {
  const { squares } = board;
  const { fromIndexed, toIndexed } = move;
  const [fromY, fromX] = fromIndexed;
  const [toY, toX] = toIndexed;

  // Extract piece
  const piece = squares[fromY][fromX].piece as IPiece;
  const { color } = piece;
  const opponentColor = color === 'white' ? 'black' : 'white';

  // Update piece current position
  updatePieceOnBoard(squares, [fromY, fromX], [toY, toX]);

  // Handle especial cases
  if (move.castle) handleCastle(board, color);
  if (move.enPassant) handleEnPassant(board);

  // Check en passant for previous and next turn
  handlePrevEnPassant(board);
  handleNextEnPassant(board, move);
  console.log('board after en passant check', board);

  // Validate if current player is in check
  const receivingCheck = validateCheck(squares, color);
  if (receivingCheck.isCheck) return prevBoard;

  // Validate if current player is giving check
  const givingCheck = validateCheck(squares, opponentColor);
  // Save value in the board
  board.check = givingCheck.isCheck;
  board.checkmate = givingCheck.isCheck
    ? validateCheckmate(squares, opponentColor, givingCheck.threats)
    : false;
  console.log(board.checkmate);

  // Change the turn
  board.turn = board.turn === 'white' ? 'black' : 'white';

  return board;
}

function handleCastle(board: IBoard, color: string) {
  // Deconstruct board to get squares
  const { squares } = board;
  // Find king coordinates
  const coords = getKingCoords(squares, color);

  // Check if the castle is king side or queen side
  const kingSide = coords[1] === 6;

  // Get rook current X and Y coordinates
  const currentCol = kingSide ? 7 : 0;
  const row = color === 'white' ? 7 : 0;
  // Get rook new X position
  const newCol = kingSide ? 5 : 3;

  // Update rook position
  updatePieceOnBoard(squares, [row, currentCol], [row, newCol]);

  // Update castles
  const whiteCase = [false, false, ...board.castles.slice(2)];
  const blackCase = [...board.castles.slice(0, 2), false, false];
  board.castles = color === 'white' ? whiteCase : blackCase;
}

function handleEnPassant(board: IBoard) {
  // Deconstruct board to get squares
  const { squares, enPassant } = board;
  // Deconstruct enPassant to get coords
  const { coords } = enPassant;
  // Get the piece that is going to be captured
  squares[coords[0]][coords[1]].piece = undefined;
  squares[coords[0]][coords[1]].image = 'empty-square';
  // Remove enPassant from the board
  board.enPassant = { coords: [], active: false };
}

function handleNextEnPassant(board: IBoard, move: IMove) {
  // Validate if the move is a pawn's double step
  if (!move.doubleStep) return;
  // Deconstruct board to get squares
  const { squares } = board;
  // Deconstruct move to get coords and color
  const [row, col] = move.toIndexed;
  const color = move.piece.color;
  // Check for opposite pawns on the left and right
  const leftPiece = squares?.[row]?.[col - 1]?.piece;
  const rightPiece = squares?.[row]?.[col + 1]?.piece;
  // Check if the piece is a pawn
  const leftPawn = leftPiece?.pieceType?.name === 'pawn';
  const rightPawn = rightPiece?.pieceType?.name === 'pawn';
  // Check if the pawn is of the opposite color
  const leftOpposite = leftPiece?.color !== color;
  const rightOpposite = rightPiece?.color !== color;
  // Final validation
  if (!(leftPawn && leftOpposite) && !(rightPawn && rightOpposite)) return;
  // Set enPassant
  board.enPassant = { coords: [row, col], active: true };
}

function handlePrevEnPassant(board: IBoard) {
  if (!board.enPassant.active) return;
  board.enPassant = { coords: [], active: false };
}

export function updatePieceOnBoard(
  squares: ISquare[][],
  [fromY, fromX]: number[],
  [toY, toX]: number[]
) {
  // Extract piece
  const piece = squares[fromY][fromX].piece as IPiece;
  piece.currentSquare = squares[toY][toX].code;
  // Update piece current position
  piece.currentSquare = squares[toY][toX].code;
  // Move the piece to the new position
  squares[toY][toX].piece = piece;
  squares[toY][toX].image = piece.image;
  // Remove the piece from the previous position
  squares[fromY][fromX].piece = undefined;
  squares[fromY][fromX].image = 'empty-square';
}
