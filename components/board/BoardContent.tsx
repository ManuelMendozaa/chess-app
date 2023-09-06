import React from 'react';
import {
  generateBoard,
  generateValidMoves,
  getNotation,
  updateBoard,
} from '../../lib';
import { useMouseEvents } from '../../hooks';
import Square from './Square';

type Position = (0 | 1)[][][];
type Move = { position: Position; code: string };
type Game = { moves: Move[]; winner?: 0 | 1 | null };

export default function BoardContent() {
  const [position, setPosition] = React.useState<(0 | 1)[][][]>(
    generateBoard()
  );
  const [validMoves, setValidMoves] = React.useState<any[]>([]);
  const [check, setCheck] = React.useState<boolean>(false);
  const [checkmate, setCheckmate] = React.useState<boolean>(false);
  const [game, setGame] = React.useState<Game>({ moves: [] });
  const [activeMove, setActiveMove] = React.useState<number>(0);
  const ref = React.useRef<HTMLDivElement>(null);

  const onPositionUpdate = (initSquare: number[], targetSquare: number[]) => {
    // if (activeMove !== game.moves.length - 1 && game.moves.length) return;

    const { position: _position, valid } = updateBoard(
      position as (0 | 1)[][][],
      validMoves,
      initSquare,
      targetSquare
    );

    if (!valid) return;

    const initFilters = position[initSquare[0]][initSquare[1]];
    const pieceIndex = initFilters.findIndex((p) => p !== 0);
    const targetFilters = position[targetSquare[0]][targetSquare[1]];
    const capturePieceIndex = targetFilters.findIndex((p) => p !== 0);
    const isCapture = capturePieceIndex !== -1 && capturePieceIndex < 12;
    const { check, moves } = generateValidMoves(_position);

    const moveNotation = getNotation(
      initSquare,
      targetSquare,
      pieceIndex,
      isCapture,
      check,
      check && moves.length === 0
    );

    const gameMoves = [
      ...game.moves,
      { position: _position, code: moveNotation },
    ];
    setGame({ moves: gameMoves });
    setPosition(_position);
    setActiveMove(Math.max(game.moves.length, 0));
  };

  const { onMouseDown, onMouseMove, onMouseUp } = useMouseEvents(
    ref,
    onPositionUpdate
  );

  const resetBoard = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setPosition(generateBoard());
    setGame({ moves: [] });
  };

  React.useEffect(() => {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        setActiveMove((prev) => Math.max(prev - 1, 0));
      }
      if (e.key === 'ArrowRight') {
        setActiveMove((prev) => prev + 1);
      }
    });
  }, []);

  React.useEffect(() => {
    if (activeMove >= game.moves.length - 1) {
      return setActiveMove(game.moves.length - 1);
    }
    if (game?.moves) {
      const _position = game?.moves?.[activeMove]?.position;
      if (_position) setPosition(_position);
    }
  }, [activeMove]);

  React.useEffect(() => {
    const simulate = true;

    if (!simulate) return;
    let counter = 0;

    let _position = generateBoard();
    let check = false;
    let moves = [];
    const res = generateValidMoves(_position);
    check = res.check;
    moves = res.moves;
    let gameMoves: Move[] = [];

    const start = new Date();

    while (counter < 200) {
      if (check && moves.length === 0) break;

      const filters = _position[0][0][12]
        ? [6, 7, 8, 9, 10, 11]
        : [0, 1, 2, 3, 4, 5];
      const turnMoves = moves.filter(
        (m) => filters.includes(m.filter) && !m.protective
      );
      const randomIndex = Math.floor(Math.random() * turnMoves.length);
      const randomMove = turnMoves[randomIndex];

      if (!randomMove) {
        break;
      }

      const { initSquare, targetSquare } = randomMove;

      const updatedBoard = updateBoard(
        _position as (0 | 1)[][][],
        moves,
        initSquare,
        targetSquare
      );

      const initFilters = _position[initSquare[0]][initSquare[1]];
      const pieceIndex = initFilters.findIndex((p) => p !== 0);
      const targetFilters = _position[targetSquare[0]][targetSquare[1]];
      const capturePieceIndex = targetFilters.findIndex((p) => p !== 0);
      const isCapture = capturePieceIndex !== -1 && capturePieceIndex < 12;

      _position = updatedBoard.position.map((r) => r.map((c) => [...c]));

      const res2 = generateValidMoves(_position);
      check = res2.check;
      moves = res2.moves;

      const moveNotation = getNotation(
        initSquare,
        targetSquare,
        pieceIndex,
        isCapture,
        check,
        check && moves.length === 0
      );

      gameMoves = [
        ...gameMoves,
        {
          position: _position.map((r) => r.map((c) => [...c])),
          code: moveNotation,
        },
      ];

      counter += 1;
    }

    const end = new Date();
    console.log(end.getTime() - start.getTime());

    setPosition(_position);
    setGame({ moves: gameMoves });
  }, []);

  React.useEffect(() => {
    if (position) {
      const { check, moves } = generateValidMoves(position);
      setCheck(check);
      setValidMoves(moves);
      setCheckmate(check && moves.length === 0);
    }
  }, [position]);

  return (
    <div className="h-full flex flex-row gap-5">
      <div
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        id="board"
        className="h-full grid grid-cols-8 auto-cols-max rounded-xl overflow-hidden shrink-0"
        ref={ref}
      >
        {position?.map((rows, r) =>
          rows.map((cols, c) => (
            <Square
              key={`square-${r}-${c}`}
              index={r + c}
              pieceTypeIndex={position[r][c].findIndex((p) => p !== 0)}
              check={check}
              checkmate={checkmate}
              turn={position?.[0]?.[0]?.[12] ? 'black' : 'white'}
            />
          ))
        )}
      </div>
      <div className="h-full w-[400px] shrink-0 bg-neutral-700 rounded-xl p-4 flex flex-col gap-5">
        <button
          type="button"
          className="w-full bg-neutral-600 rounded-lg px-6 py-2 text-lg text-white"
          onClick={resetBoard}
        >
          Reset
        </button>
        <div className="w-full grid grid-cols-2 rounded-lg overflow-hidden bg-neutral-600 overflow-y-auto">
          {game.moves.map((move, index) => (
            <button
              key={`move-${index}`}
              type="button"
              className={`border-b-4 ${
                index % 2 === 0 ? 'border-neutral-200' : 'border-neutral-700'
              } ${
                index === activeMove ? 'bg-neutral-500' : ''
              } py-2 text-neutral-100 font-medium`}
              onClick={() => {
                setPosition(move.position);
                setActiveMove(index);
              }}
            >
              {move.code}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
