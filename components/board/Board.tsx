import React from 'react';
import BoardContent from './BoardContent';

export default function Board() {
  React.useEffect(() => {
    function setBoardSize() {
      const element = document.getElementById('board');
      if (element) {
        if (window.innerWidth < window.innerHeight) {
          element.style.height = `${element.clientWidth}px`;
        } else {
          element.style.width = `${element.clientHeight}px`;
        }
      }
    }
    window.addEventListener('resize', setBoardSize);
    setBoardSize();
  }, []);

  return <BoardContent />;
}
