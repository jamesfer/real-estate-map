import { Point, pointsEqual } from './point';

export interface Tile {
  // Zoom level
  zoom: number;
  // Tile coordinates
  point: Point;
}

export function generateTileHash({ zoom, point: { x, y } }: Tile) {
  return `${zoom}-${x}-${y}`;
}

export function tilesEqual(left: Tile, right: Tile) {
  return left.zoom === right.zoom && pointsEqual(left.point, right.point);
}
