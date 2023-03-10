export type ColorEnum = 'white' | 'black';
export type BoardStatusEnum = 'default' | 'check' | 'checkmate' | 'stalemate';
export type PieceNameEnum =
  | 'pawn'
  | 'rook'
  | 'knight'
  | 'bishop'
  | 'queen'
  | 'king';

export interface IBoard {
  squares: ISquare[][];
  status: BoardStatusEnum;
  turn: ColorEnum;
  castles: boolean[];
  check: boolean;
  checkmate: boolean;
  enPassant: IEnPassant;
}

export interface IEnPassant {
  active: boolean;
  coords: number[];
}

export interface IMove {
  board: IBoard;
  piece: IPiece;
  fromIndexed: [number, number];
  toIndexed: [number, number];
  from?: string;
  to?: string;
  capture?: boolean;
  promotion?: boolean;
  check?: boolean;
  checkmate?: boolean;
  stalemate?: boolean;
  enPassant?: boolean;
  castle?: boolean;
  doubleStep?: boolean;
  enPassantCapture?: IEnPassant;
}

export interface IPiece {
  _id: string;
  color: ColorEnum;
  pieceType: IPieceType;
  initSquare: string;
  currentSquare: string;
  active: boolean;
  image: string;
}

export interface IPieceType {
  name: PieceNameEnum;
  value: number;
}

export interface ISquare {
  code: string;
  piece?: IPiece;
  image: string;
}
