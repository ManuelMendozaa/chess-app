/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { getPieceType } from '../../lib';

interface SquareProps {
  index: number;
  pieceColorIndex?: 0 | 1;
  pieceTypeIndex: number;
  check: boolean;
  checkmate: boolean;
  turn: 'white' | 'black';
}

function getBackgroundColor(
  index: number,
  pieceType: string,
  pieceColor: 'white' | 'black',
  turn: 'white' | 'black',
  check: boolean,
  checkmate: boolean
) {
  const isKing = pieceType === 'king';
  if (isKing && pieceColor === turn && checkmate) return 'bg-indigo-500';
  if (isKing && pieceColor === turn && check) return 'bg-red-500';
  return index % 2 !== 0 ? 'bg-[#1f8167]' : 'bg-[#baefde]';
}

export default function Square({
  index,
  pieceTypeIndex,
  check,
  checkmate,
  turn,
}: SquareProps) {
  const pieceType = getPieceType(pieceTypeIndex);
  const pieceColor = pieceTypeIndex < 6 ? 'white' : 'black';
  const image = pieceType ? `${pieceColor}-${pieceType}` : null;
  const bg = getBackgroundColor(
    index,
    pieceType,
    pieceColor,
    turn,
    check,
    checkmate
  );
  return (
    <div
      className={`h-full w-full flex justify-center items-center selectDisable ${bg}`}
    >
      <img
        src={`/pieces/${image ?? 'empty-square'}.png`}
        className={`${pieceType ? 'piece cursor-pointer' : ''}`}
        alt=""
        draggable={false}
      />
    </div>
  );
}
