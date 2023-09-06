import { getNotation } from './notation';

function saveMove(
  filter: number,
  initSquare: [number, number],
  targetSquare: [number, number],
  protective: boolean = false
) {
  return { filter, initSquare, targetSquare, protective };
}

function saveDangerZone(
  square: [number, number],
  threatsKing: boolean = false,
  blocksAttack: boolean = false,
  kingCanGo: boolean = false,
  isPiece: boolean = false,
  origin: [number, number] | null = null
) {
  return { square, threatsKing, blocksAttack, kingCanGo, isPiece, origin };
}

export function scanPawnMoves(
  filterId: number,
  filter: number[][],
  occupiedSquares: number[][][],
  enPassantFilter: number[][]
) {
  const moves: any[] = [];
  const dangerZone: any[] = [];
  const ownPieces = occupiedSquares[filterId < 6 ? 0 : 1];
  const rivalPieces = occupiedSquares[filterId < 6 ? 1 : 0];
  const pawnDirection = filterId < 6 ? -1 : 1;

  filter.forEach((row, r) =>
    row.forEach((_, c) => {
      if (filter[r][c] === 0) return;

      // Previous computation
      const nextRow = r + pawnDirection;
      const twoStepsRow = r + 2 * pawnDirection;
      const oneStepPiece =
        ownPieces?.[nextRow]?.[c] || rivalPieces?.[nextRow]?.[c];
      const twoStepsPiece =
        ownPieces?.[twoStepsRow]?.[c] || rivalPieces?.[twoStepsRow]?.[c];
      const onFirstRank =
        (r === 6 && filterId === 0) || (r === 1 && filterId === 6);

      if (nextRow > 7 || nextRow < 0) return;

      // 1. Move one step forward
      if (!oneStepPiece) {
        moves.push(saveMove(filterId, [r, c], [nextRow, c]));
      }
      // 2. Move two steps forward
      if (onFirstRank && !oneStepPiece && !twoStepsPiece) {
        moves.push(saveMove(filterId, [r, c], [twoStepsRow, c]));
      }
      // 3. Capture moves (natural and en passant)
      if (c > 0) {
        const leftCol = c - 1;
        if (rivalPieces[nextRow][leftCol] || enPassantFilter[r][leftCol]) {
          moves.push(saveMove(filterId, [r, c], [nextRow, leftCol]));
        }
        dangerZone.push(saveDangerZone([nextRow, leftCol]));
      }
      if (c < 7) {
        const rightCol = c + 1;
        if (rivalPieces[nextRow][rightCol] || enPassantFilter[r][rightCol]) {
          moves.push(saveMove(filterId, [r, c], [nextRow, rightCol]));
        }
        dangerZone.push(saveDangerZone([nextRow, rightCol]));
      }
    })
  );

  return { moves, dangerZone };
}

export function scanKnightMoves(
  filterId: number,
  filter: number[][],
  occupiedSquares: number[][][]
) {
  const moves: any[] = [];
  const dangerZone: any[] = [];
  const ownPieces = occupiedSquares[filterId < 6 ? 0 : 1];

  filter.forEach((row, r) =>
    row.forEach((_, c) => {
      if (filter[r][c] === 0) return;

      const targetColumns = [c - 2, c - 1, c + 2, c + 1];
      const targetRows = [r - 2, r - 1, r + 2, r + 1];

      targetColumns.forEach((tc, i) => {
        if (tc < 0 || tc > 7) return;
        targetRows.forEach((tr, j) => {
          if ((i + j) % 2 === 0) return;
          if (tr < 0 || tr > 7) return;

          dangerZone.push(saveDangerZone([tr, tc]));
          if (!ownPieces[tr][tc]) {
            moves.push(saveMove(filterId, [r, c], [tr, tc]));
          }
        });
      });
    })
  );
  return { moves, dangerZone };
}

export function scanBishopMoves(
  filterId: number,
  filter: number[][],
  occupiedSquares: number[][][]
) {
  const moves: any[] = [];
  const dangerZone: any[] = [];
  const ownPieces = occupiedSquares[filterId < 6 ? 0 : 1];
  const rivalPieces = occupiedSquares[filterId < 6 ? 1 : 0];
  const directions = [1, -1];

  filter.forEach((_row, r) =>
    _row.forEach((_, c) => {
      if (filter[r][c] === 0) return;

      directions.forEach((dr) => {
        directions.forEach((dc) => {
          const { moves: _moves, dangerZone: _dangerZone } = continuousMoves(
            filterId,
            r,
            c,
            dr,
            dc,
            ownPieces,
            rivalPieces
          );

          moves.push(..._moves);
          dangerZone.push(..._dangerZone);
        });
      });
    })
  );

  return { moves, dangerZone };
}

export function scanRookMoves(
  filterId: number,
  filter: number[][],
  occupiedSquares: number[][][]
) {
  const moves: any[] = [];
  const dangerZone: any[] = [];
  const ownPieces = occupiedSquares[filterId < 6 ? 0 : 1];
  const rivalPieces = occupiedSquares[filterId < 6 ? 1 : 0];
  const directions = [1, 0, -1];

  filter.forEach((_row, r) =>
    _row.forEach((_, c) => {
      if (filter[r][c] === 0) return;
      directions.forEach((dr) => {
        directions.forEach((dc) => {
          if ((dr === 0 && dc === 0) || (dr !== 0 && dc !== 0)) return;

          const { moves: _moves, dangerZone: _dangerZone } = continuousMoves(
            filterId,
            r,
            c,
            dr,
            dc,
            ownPieces,
            rivalPieces
          );

          moves.push(..._moves);
          dangerZone.push(..._dangerZone);
        });
      });
    })
  );

  return { moves, dangerZone };
}

function continuousMoves(
  filterId: number,
  r: number,
  c: number,
  rowDirection: number,
  colDirection: number,
  ownPieces: number[][],
  rivalPieces: number[][]
) {
  const moves = [];
  let dangerZone = [];

  let row = r;
  let col = c;
  let isValidMove = true;
  let kingCanGo = false;
  let threatsKing = false;
  let index = -1;
  let pieceCounter = 0;
  let counter = 0;

  while (row >= 0 && row < 8 && col >= 0 && col < 8) {
    const rivalPiece = rivalPieces[row][col];
    const ownPiece = ownPieces[row][col];
    const isPieceSquare = row === r && col === c;
    const pieceExists = rivalPiece || ownPiece;
    const isKing = rivalPiece === 2;

    if (isValidMove && !isPieceSquare) {
      moves.push(saveMove(filterId, [r, c], [row, col], !!ownPiece));
    }

    dangerZone.push(
      saveDangerZone(
        [row, col],
        false,
        false,
        kingCanGo || isPieceSquare,
        isPieceSquare,
        [r, c]
      )
    );
    if (pieceExists && isValidMove && !isPieceSquare) {
      isValidMove = false;
      index = counter;
      if (!isKing) {
        kingCanGo = true;
      }
    }

    if (pieceExists && !isKing && !isPieceSquare && !threatsKing) {
      pieceCounter += 1;
    }
    if (isKing) threatsKing = true;
    row += rowDirection;
    col += colDirection;
    counter += 1;
  }

  if (threatsKing) {
    dangerZone = dangerZone.map((dz, i) => ({
      ...dz,
      threatsKing,
      blocksAttack: i === index && pieceCounter === 1,
    }));
  }

  // if (filterId === 8) {
  //   console.log(
  //     'bishop DZ:',
  //     dangerZone.map((dz) => ({
  //       code: getNotation(dz.square, dz.square, 0),
  //       ...dz,
  //     }))
  //   );
  // }

  return { moves, dangerZone };
}

export function scanQueenMoves(
  filterId: number,
  filter: number[][],
  occupiedSquares: number[][][]
) {
  const bishopScan = scanBishopMoves(filterId, filter, occupiedSquares);
  const rookScan = scanRookMoves(filterId, filter, occupiedSquares);

  return {
    moves: [...bishopScan.moves, ...rookScan.moves],
    dangerZone: [...bishopScan.dangerZone, ...rookScan.dangerZone],
  };
}

export function scanKingMoves(
  filterId: number,
  filter: number[][],
  occupiedSquares: number[][][],
  castleFilter: number[][]
) {
  const moves: any[] = [];
  const dangerZone: any[] = [];
  const ownPieces = occupiedSquares[filterId < 6 ? 0 : 1];

  filter.forEach((_row, r) =>
    _row.forEach((_, c) => {
      if (filter[r][c] === 0) return;

      const directions = [-1, 0, 1];

      // 1. Natural moves
      directions.forEach((dr) => {
        const row = r + dr;
        if (row < 0 || row > 7) return;
        directions.forEach((dc) => {
          const col = c + dc;
          if (col < 0 || col > 7) return;
          if (dr === 0 && dc === 0) return;

          const protective = !!ownPieces[row][col];
          moves.push(saveMove(filterId, [r, c], [row, col], protective));
          dangerZone.push(saveDangerZone([row, col], false, false));
        });
      });

      // 2. Castling
      if (castleFilter[r][7]) {
        if (
          !ownPieces[r][5] &&
          !ownPieces[r][6] &&
          !occupiedSquares[0][r][5] &&
          !occupiedSquares[0][r][6]
        ) {
          moves.push(saveMove(filterId, [r, c], [r, 6]));
        }
      }
      if (castleFilter[r][0]) {
        if (
          !ownPieces[r][1] &&
          !ownPieces[r][2] &&
          !ownPieces[r][3] &&
          !occupiedSquares[0][r][1] &&
          !occupiedSquares[0][r][2] &&
          !occupiedSquares[0][r][3]
        ) {
          moves.push(saveMove(filterId, [r, c], [r, 2]));
        }
      }
    })
  );

  return { moves, dangerZone };
}
