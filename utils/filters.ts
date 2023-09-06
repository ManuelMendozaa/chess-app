export function getFilter(position: number[][][], filterId: number) {
  return position.map((row) => row.map((col) => col[filterId]));
}

export function getFilters(position: number[][][]) {
  return Array.from({ length: 12 }, (_, i) => getFilter(position, i));
}
