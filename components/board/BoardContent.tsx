import React from 'react';
import { IBoard } from '../../models';
import { grabPiece, dropPiece, movePiece } from '../../utils/moves';
import Square from './Square';

interface BoardContentProps {
  board: IBoard;
  setBoard: React.Dispatch<React.SetStateAction<IBoard | null>>;
}

type PieceElement = HTMLImageElement | null;

export default function BoardContent({ board, setBoard }: BoardContentProps) {
  const [selectedPiece, setSelectedPiece] = React.useState<PieceElement>(null);
  const [selectedPieceX, setSelectedPieceX] = React.useState<number>(0);
  const [selectedPieceY, setSelectedPieceY] = React.useState<number>(0);

  const ref = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Get basic values to continue
    const target = e.target as PieceElement;
    const _board = ref.current;

    // If no board or no piece selected, don't continue
    if (!_board || !target?.className.includes('piece')) return;

    // Handle grabbing the piece
    const { i, j } = grabPiece(e, _board, target);

    setSelectedPiece(target);
    setSelectedPieceX(j);
    setSelectedPieceY(i);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const _board = ref.current;
    if (!selectedPiece || !_board) return;
    // Handle moving the piece
    movePiece(e, _board, selectedPiece);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const _board = ref.current;
    if (!selectedPiece || !_board) return;

    // Handle dropping the piece
    const __board = dropPiece(
      e,
      _board,
      board as IBoard,
      selectedPieceX,
      selectedPieceY
    );
    setBoard(__board);

    // Get target and change absolute position to static
    let target = e.target as HTMLImageElement;
    target.style.position = 'static';

    // Update react hooks
    setSelectedPiece(null);
    setSelectedPieceX(0);
    setSelectedPieceY(0);
  };
  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      id="board"
      className="h-full grid grid-rows-[8] rounded-xl overflow-hidden"
      ref={ref}
    >
      {board?.squares?.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid grid-cols-8">
          {row.map((square, colIndex) => (
            <Square
              key={`square-${square.code}`}
              index={rowIndex + colIndex}
              {...square}
              check={board?.check ?? false}
              checkmate={board?.checkmate ?? false}
              turn={board?.turn ?? ''}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
