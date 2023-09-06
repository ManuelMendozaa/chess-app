import React from 'react';
import { updateBoard } from '../lib';

type PieceElement = HTMLImageElement | null;

export function useMouseEvents(
  ref: React.RefObject<HTMLDivElement>,
  onPositionUpdate: (initSquare: number[], targetSquare: number[]) => void
) {
  const [selectedPiece, setSelectedPiece] = React.useState<PieceElement>(null);
  const [selectedPieceX, setSelectedPieceX] = React.useState<number>(0);
  const [selectedPieceY, setSelectedPieceY] = React.useState<number>(0);

  // Event handlers
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Get basic values to continue
    const target = e.target as PieceElement;
    const _board = ref.current;

    // If no board or no piece selected, don't continue
    if (!_board || !target?.className.includes('piece')) return;

    // Handle grabbing the piece
    const { i, j } = grabPiece(e, target);

    setSelectedPiece(target);
    setSelectedPieceX(j);
    setSelectedPieceY(i);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const _board = ref.current;
    if (!selectedPiece || !_board) return;
    // Handle moving the piece
    movePiece(e, selectedPiece);
  };

  const onMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedPiece) return;

    const initSquare = [selectedPieceY, selectedPieceX];
    const targetSquare = getTargetSquare(e);
    onPositionUpdate(initSquare, targetSquare);

    let target = e.target as HTMLImageElement;
    target.style.position = 'static';

    setSelectedPiece(null);
    setSelectedPieceX(0);
    setSelectedPieceY(0);
  };

  // Helper functions
  function getTargetSquare(e: React.MouseEvent<HTMLDivElement>) {
    const { clientX: x, clientY: y } = e;
    const { minX, minY, width, height } = getBoardDimensions();
    const i = Math.floor(((y - minY) / height) * 8);
    const j = Math.floor(((x - minX) / width) * 8);
    return [i, j];
  }

  function getBoardDimensions() {
    const minX = ref.current?.offsetLeft ?? 0;
    const minY = ref.current?.offsetTop ?? 0;
    const width = ref.current?.offsetWidth ?? 0;
    const height = ref.current?.offsetHeight ?? 0;
    const maxX = minX + width;
    const maxY = minY + height;
    return { minX, minY, maxX, maxY, width, height };
  }

  function movePiece(
    e: React.MouseEvent<HTMLDivElement>,
    piece: HTMLImageElement
  ) {
    const { minX, minY, maxX, maxY } = getBoardDimensions();
    const { clientX: x, clientY: y } = e;
    if (x < minX || x > maxX || y < minY || y > maxY) return;
    updatePiecePosition(piece, x, y);
  }

  function grabPiece(
    e: React.MouseEvent<HTMLDivElement>,
    piece: HTMLImageElement
  ) {
    const { clientX: x, clientY: y } = e;
    const [i, j] = getTargetSquare(e);
    updatePiecePosition(piece, x, y);
    return { i, j };
  }

  function updatePiecePosition(piece: HTMLImageElement, x: number, y: number) {
    piece.style.position = 'absolute';
    piece.style.left = `${x - Number(piece.width) / 2}px`;
    piece.style.top = `${y - Number(piece.height) / 2}px`;
  }

  return { onMouseDown, onMouseMove, onMouseUp };
}
