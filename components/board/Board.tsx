import React from 'react';
import { IBoard } from '../../models';
import { generateBoard } from '../../utils';
import BoardContent from './BoardContent';

export default function Board() {
  const [board, setBoard] = React.useState<IBoard | null>(null);

  React.useEffect(() => {
    const _board = generateBoard();
    setBoard(_board);
  }, []);

  React.useEffect(() => {
    const element = document.getElementById('board');
    if (element) {
      element.style.width = `${element.clientHeight}px`;
    }
  }, []);

  return <BoardContent board={board as IBoard} setBoard={setBoard} />;
}
