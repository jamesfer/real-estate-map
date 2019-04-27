export interface Point {
  x: number,
  y: number,
}

export function pointsEqual(left: Point, right: Point) {
  return left.x === right.x && left.y === right.y;
}
