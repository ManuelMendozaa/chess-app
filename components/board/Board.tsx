import React from 'react';
import { IBoard } from '../../models';
import { generateBoard } from '../../utils';
import Square from './Square';

export default function Board() {
  const [board, setBoard] = React.useState<IBoard>(generateBoard());

  React.useEffect(() => {
    const element = document.getElementById('board');
    if (element) {
      element.style.width = `${element.clientHeight}px`;
    }
  });

  return (
    <div
      id="board"
      className="h-full grid grid-rows-[8] rounded-xl overflow-hidden"
    >
      {board.squares.reverse().map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid grid-cols-8">
          {row.map((square, colIndex) => (
            <Square
              key={`square-${square.code}`}
              index={rowIndex + colIndex}
              square={square}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
