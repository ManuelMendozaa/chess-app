import { getFilters, getFilter } from '../utils';
import { validateCheck } from './check';
import { getNotation } from './notation';
import {
  scanPawnMoves,
  scanKnightMoves,
  scanBishopMoves,
  scanRookMoves,
  scanQueenMoves,
  scanKingMoves,
} from './pieces';

// Main function
export function generateValidMoves(position: (0 | 1)[][][]) {
  const color = position[0][0][12] as 0 | 1;
  const kingsTurnFilter = Number(color === 0 ? 5 : 11);

  const { validMoves } = scanPosition(position);

  const kingSquare = position.reduce((acc, rows, r) => {
    const kingsCol = rows.findIndex((col) => col[kingsTurnFilter] === 1);
    if (kingsCol !== -1) acc = [r, kingsCol];
    return acc;
  }, [] as number[]);

  const { check, defensiveMoves } = validateCheck(
    validMoves,
    kingSquare,
    color
  );

  const moves = (check ? defensiveMoves : validMoves).filter(
    (m) => !m.protective
  );

  return { check, moves };
}

// Aux functions
function scanPosition(position: number[][][]) {
  const color = position[0][0][12] as 0 | 1;
  const playerFilters = color === 0 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];
  const kingsTurnFilter = Number(color === 0 ? 5 : 11);
  const filters = getFilters(position);
  const occupiedSquares = getOccupiedSquares(position);

  const moves: any[] = [];
  const dangerZone: any[] = [];

  filters.forEach((f, i) => {
    let scan = { moves: [], dangerZone: [] } as any;

    if ([0, 6].includes(i)) {
      const enPassantFilter = getFilter(position, 13);
      scan = scanPawnMoves(i, f, occupiedSquares, enPassantFilter);
    } else if ([1, 7].includes(i)) {
      scan = scanKnightMoves(i, f, occupiedSquares);
    } else if ([2, 8].includes(i)) {
      scan = scanBishopMoves(i, f, occupiedSquares);
    } else if ([3, 9].includes(i)) {
      scan = scanRookMoves(i, f, occupiedSquares);
    } else if ([4, 10].includes(i)) {
      scan = scanQueenMoves(i, f, occupiedSquares);
    } else if ([5, 11].includes(i)) {
      const castlesFilter = getFilter(position, 13);
      scan = scanKingMoves(i, f, occupiedSquares, castlesFilter);
    }

    moves.push(...(scan as any).moves);
    if (!playerFilters.includes(i)) {
      const newDangerZone = (scan as any).dangerZone.reduce(
        (acc: any[], dz: any) => {
          const [row, col] = dz.square;
          const index = acc.findIndex(
            (s: any) => s.square[0] === row && s.square[1] === col
          );
          if (index === -1) return [...acc, dz];

          acc[index].threatsKing ||= dz.threatsKing;
          acc[index].kingCanGo &&= dz.kingCanGo;
          acc[index].blocksAttack ||= dz.blocksAttack;

          return acc;
        },
        []
      );

      dangerZone.forEach((square, index) => {
        const [row, col] = square.square;
        const repeatedDZIndex = newDangerZone.findIndex(
          (s: any) => s.square[0] === row && s.square[1] === col
        );
        const repeatedDZ = newDangerZone[repeatedDZIndex];
        if (!repeatedDZ) return;

        dangerZone[index].threatsKing ||= repeatedDZ.threatsKing;
        dangerZone[index].kingCanGo &&= repeatedDZ.kingCanGo;
        dangerZone[index].blocksAttack ||= repeatedDZ.blocksAttack;
        newDangerZone[repeatedDZIndex].repeated = true;
      });

      dangerZone.push(...newDangerZone.filter((s: any) => !s.repeated));
    }
  });

  const validMoves = filterByDangerZone(
    moves,
    dangerZone,
    playerFilters,
    kingsTurnFilter
  );

  return { validMoves, dangerZone };
}

function filterByDangerZone(
  validMoves: any[],
  dangerZone: any[],
  playerFilters: number[],
  kingsTurnFilter: number
) {
  return validMoves.filter((move) => {
    if (!playerFilters.includes(move.filter)) return true;
    const kingMove = move.filter === kingsTurnFilter;
    const square = kingMove ? move.targetSquare : move.initSquare;
    const [row, col] = square;

    const dangerSquare = dangerZone.find(
      (s) => s.square[0] === row && s.square[1] === col
    );

    const { targetSquare } = move;
    const targetDangerSquare = dangerZone.find(
      (s) => s.square[0] === targetSquare[0] && s.square[1] === targetSquare[1]
    );

    const moveCondition = kingMove
      ? dangerSquare?.kingCanGo || targetDangerSquare?.isPiece
      : !dangerSquare?.blocksAttack || targetDangerSquare?.threatsKing;

    const isCastle =
      kingMove && Math.abs(move.targetSquare[1] - move.initSquare[1]) === 2;

    if (isCastle) {
      const castleDirection =
        move.targetSquare[1] > move.initSquare[1] ? -1 : 1;
      const inBetweenDangerZone = dangerZone.find(
        (s) => s.square[0] === row && s.square[1] === col + castleDirection
      );
      return (
        (!dangerSquare || moveCondition) &&
        (!inBetweenDangerZone || inBetweenDangerZone.kingCanGo)
      );
    }

    if (
      dangerSquare &&
      dangerSquare?.blocksAttack &&
      !kingMove &&
      dangerSquare.threatsKing &&
      dangerSquare.origin
    ) {
      const { origin } = dangerSquare;
      const [originRow, originCol] = origin;
      const [targetRow, targetCol] = move.targetSquare;

      const rowDiff = targetRow - originRow;
      const colDiff = targetCol - originCol;

      return rowDiff === 0 || colDiff === 0 || rowDiff === colDiff;
    }

    if (move.filter === 3) {
      const notation = getNotation(
        move.initSquare,
        move.targetSquare,
        move.filter
      );
      console.log(
        'filtering moves:',
        notation,
        dangerSquare,
        targetDangerSquare,
        moveCondition
      );
    }

    return !dangerSquare || moveCondition;
  });
}

// More aux functions
function getOccupiedSquares(position: number[][][]) {
  return Array.from({ length: 2 }, (_, i) =>
    position.map((row, r) =>
      row.map((col, c) =>
        col.reduce((acc, _, index) => {
          if (!(index >= i * 6) || !(index < i * 6 + 6)) return acc;
          if (position[r][c][index] === 1 && [5, 11].includes(index)) return 2;
          if (position[r][c][index] === 1) return 1;
          return acc;
        }, 0)
      )
    )
  );
}
