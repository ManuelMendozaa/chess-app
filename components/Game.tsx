import React from 'react';
import { Board } from './board';

export default function Game() {
  return (
    <div className="w-full h-screen flex justify-center items-center p-20 bg-neutral-800">
      <Board />
    </div>
  );
}
