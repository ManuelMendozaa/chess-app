/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { ISquare } from '../../models';

interface SquareProps {
  index: number;
  square: ISquare;
}

export default function Square({ index, square }: SquareProps) {
  return (
    <div
      className={`h-full w-full flex justify-center items-center p-0.5 ${
        index % 2 === 0 ? 'bg-[#1f8167]' : 'bg-[#baefde]'
      } ${square.piece ? 'cursor-pointer' : ''}`}
    >
      <img src={`/pieces/${square.image}.png`} alt="" draggable={false} />
    </div>
  );
}
