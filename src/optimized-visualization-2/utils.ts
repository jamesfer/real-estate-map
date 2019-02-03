import { MonoTypeOperatorFunction } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MutationFactory } from './store/mutations';
import { store } from './store/store';

export interface Listenable {
  addListener(event: string, handler: (...args: any[]) => void): google.maps.MapsEventListener,
}

export function addObserableListener(
  event: string,
  handler: (...args: any[]) => void,
): MonoTypeOperatorFunction<Listenable> {
  let lastObject: Listenable | null = null;
  let listener: google.maps.MapsEventListener | null = null;
  return tap((object) => {
    if (object && object !== lastObject) {
      if (listener) {
        listener.remove();
        listener = null;
      }
      listener = object.addListener(event, handler);
      lastObject = object;
    }
  });
}

export function dispatchOnEmit<T>(mutation: MutationFactory<T>): MonoTypeOperatorFunction<T> {
  return tap((object) => store.dispatch(mutation(object)));
}

export function debounce(fn: Function, delay = 16) {
  let timeout: any = null;
  return (...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export interface Bounds {
  north: number,
  south: number,
  east: number,
  west: number,
}

export interface Point {
  x: number,
  y: number,
}

export interface Coordinate {
  latitude: number,
  longitude: number,
}

const TILE_SIZE = 256;

export function spiralLoop(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  callback: (x: number, y: number) => any,
) {
  const startX = Math.floor((minX + maxX) / 2);
  const startY = Math.floor((minY + maxY) / 2);
  const insideX = (x: number) => x >= minX && x <= maxX;
  const insideY = (y: number) => y >= minY && y <= maxY;

  // Continue to loop in spirals until we go an entire loop without calling the callback
  let callbackCalled = true;
  for (let i = 0; callbackCalled; i++) {
    callbackCalled = false;

    if (insideY(startY - i)) {
      for (let x = -i; x <= i; x++) {
        if (insideX(startX + x)) {
          callbackCalled = true;
          callback(startX + x, startY - i);
        }
      }
    }

    if (insideX(startX + i)) {
      for (let y = -i + 1; y <= i; y++) {
        if (insideY(startY + y)) {
          callbackCalled = true;
          callback(startX + i, startY + y);
        }
      }
    }

    if (insideY(startY + i)) {
      for (let x = i - 1; x >= -i; x--) {
        if (insideX(startX + x)) {
          callbackCalled = true;
          callback(startX + x, startY + i);
        }
      }
    }

    if (insideX(startX - i)) {
      for (let y = i - 1; y > -i; y--) {
        if (insideY(startY + y)) {
          callbackCalled = true;
          callback(startX - i, startY + y);
        }
      }
    }
  }
}

export function generateSpiralCoordinates(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
) {
  const points: Point[] = [];
  spiralLoop(minX, maxX, minY, maxY, (x, y) => points.push({ x, y }));
  return points;
}

/**
 * Returns a mercator projection of the coordinates.
 */
export function project({ latitude, longitude }: Coordinate): Point {
  const sinY = Math.sin(latitude * Math.PI / 180);

  // Truncating to 0.9999 effectively limits latitude to 89.189. This is
  // about a third of a tile past the edge of the world tile.
  const cappedSinY = Math.min(Math.max(sinY, -0.9999), 0.9999);

  return {
    x: TILE_SIZE * (0.5 + longitude / 360),
    y: TILE_SIZE * (0.5 - Math.log((1 + cappedSinY) / (1 - cappedSinY)) / (4 * Math.PI)),
  };
}

/**
 * Converts a latitude and longitude into tile coordinates at a given zoom level.
 */
export function degreesToTiles(coordinate: Coordinate, zoom: number): Point {
  const scale = 1 << zoom;
  const worldCoordinate = project(coordinate);
  return {
    x: Math.floor(worldCoordinate.x * scale / TILE_SIZE),
    y: Math.floor(worldCoordinate.y * scale / TILE_SIZE),
  };
}

export function arrayOverwrite<T>(array: T[], index: number, value: T): T[] {
  return [
    ...array.slice(0, index),
    value,
    ...array.slice(index + 1),
  ];
}
