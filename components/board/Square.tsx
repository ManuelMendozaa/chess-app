/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { IPiece, ISquare } from '../../models';

interface SquareProps {
  index: number;
  piece?: IPiece | null;
  image: string;
  code: string;
  check: boolean;
  checkmate: boolean;
  turn: string;
}

export default function Square({
  index,
  piece = null,
  image,
  code,
  check,
  checkmate,
  turn,
}: SquareProps) {
  let bg = index % 2 !== 0 ? 'bg-[#1f8167]' : 'bg-[#baefde]';
  if (piece?.pieceType?.name === 'king' && piece?.color === turn && check) {
    bg = 'bg-red-500';
  }
  if (piece?.pieceType?.name === 'king' && piece?.color === turn && checkmate) {
    bg = 'bg-indigo-500';
  }
  return (
    <div
      className={`h-full w-full flex justify-center items-center p-0.5 ${bg} ${
        piece ? 'cursor-pointer' : ''
      }`}
    >
      <img
        src={`/pieces/${image ?? 'empty-square'}.png`}
        className={`${piece ? 'piece' : ''}`}
        alt=""
        draggable={false}
      />
    </div>
  );
}
