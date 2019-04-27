import { Coordinates, CoordinateArea } from './models/coordinates';
import { Point } from './models/point';
import { Tile } from './models/tile';

/**
 * Returns a mercator projection of the coordinates, converting them from degrees to world pixels.
 */
export function degreesToPixels(tileSize: number, { latitude, longitude }: Coordinates): Point {
  const sinY = Math.sin(latitude * Math.PI / 180);

  // Truncating to 0.9999 effectively limits latitude to 89.189. This is
  // about a third of a tile past the edge of the world tile.
  const cappedSinY = Math.min(Math.max(sinY, -0.9999), 0.9999);

  return {
    x: tileSize * (0.5 + longitude / 360),
    y: tileSize * (0.5 - Math.log((1 + cappedSinY) / (1 - cappedSinY)) / (4 * Math.PI)),
  };
}

/**
 * Converts world pixel coordinates to degrees
 */
export function pixelsToDegrees(tileSize: number, { x, y }: Point): Coordinates {
  // Derived from https://www.wolframalpha.com/input/?i=solve+Y%2FT+%3D+0.5+-+(log((1+%2B+L)+%2F+(1+-+L))+%2F+(4%CF%80))+for+L
  // where L = Math.sin(longitude * Math.PI / 180) and T = tileSize
  const ePi = Math.E ** (2 * Math.PI);
  const eY = Math.E ** ((4 * y * Math.PI) / tileSize);
  const sinY = (ePi - eY) / (ePi + eY);
  return {
    latitude: Math.asin(sinY) * 180 / Math.PI,
    longitude: 360 * (x / tileSize - 0.5),
  };
}

/**
 * Converts world pixel coordinates to tile coordinates.
 */
export function pixelsToTiles(tileSize: number, zoom: number, { x, y }: Point): Point {
  const scale = 1 << zoom;
  return {
    x: Math.floor(x * scale / tileSize),
    y: Math.floor(y * scale / tileSize),
  };
}

/**
 * Converts tile coordinates to world pixel coordinates.
 */
export function tilesToPixels(tileSize: number, zoom: number, { x, y }: Point): Point {
  const scale = 1 << zoom;
  return {
    x: x * tileSize / scale,
    y: y * tileSize / scale,
  };
}

/**
 * Converts a latitude and longitude into tile coordinates at a given zoom level.
 */
export function degreesToTiles(tileSize: number, zoom: number, coordinate: Coordinates): Point {
  return pixelsToTiles(tileSize, zoom, degreesToPixels(tileSize, coordinate));
}

export function tilesToDegrees(tileSize: number, zoom: number, point: Point): Coordinates {
  return pixelsToDegrees(tileSize, tilesToPixels(tileSize, zoom, point));
}

/**
 * Convert a tile coordinate into local pixel coordinates.
 */
export function tileToLocalPixels(tileSize: number, { x, y }: Point): Point {
  return {
    x: tileSize * x,
    y: tileSize * y,
  };
}

/**
 * Converts local pixel coordinates to world pixel coordinates.
 */
export function localPixelsToWorldPixels(zoom: number, { x, y }: Point): Point {
  const scale = 1 << zoom;
  return {
    x: x / scale,
    y: y / scale,
  };
}

export function worldPixelsToLocalPixels(zoom: number, { x, y }: Point): Point {
  const scale = 1 << zoom;
  return {
    x: x * scale,
    y: y * scale,
  }
}

export function degreesToInnerTileCoordinates(
  tileSize: number,
  tile: Tile,
  coordinates: Coordinates,
): Point {
  const localTile = tileToLocalPixels(tileSize, tile.point);
  const localPixels = worldPixelsToLocalPixels(tile.zoom, degreesToPixels(tileSize, coordinates));
  return {
    x: localPixels.x - localTile.x,
    y: localPixels.y - localTile.y,
  };
}

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

export function calculateVisibleTiles(
  tileSize: number,
  zoom: number,
  coordinateArea: CoordinateArea,
): Tile[] {
  // Generate the list of tile coordinates
  const { x: minX, y: minY } = degreesToTiles(tileSize, zoom, coordinateArea.northWest);
  const { x: maxX, y: maxY } = degreesToTiles(tileSize, zoom, coordinateArea.southEast);
  return generateSpiralCoordinates(minX, maxX, minY, maxY).map(point => ({ point, zoom }));
}

export function tileToArea(tileSize: number, { zoom, point: { x, y } }: Tile): CoordinateArea {
  return {
    northWest: tilesToDegrees(tileSize, zoom, { x, y }),
    southEast: tilesToDegrees(tileSize, zoom, { x: x + 1, y: y + 1}),
  };
}

/**
 * Checks if a coordinate is inside an area.
 * TODO currently has a bug around maximum values of longitude and latitude
 */
export function coordinateIsInsideArea(
  coordinates: Coordinates,
  area: CoordinateArea,
): boolean {
  return coordinates.latitude >= area.southEast.latitude
    && coordinates.latitude <= area.northWest.latitude
    && coordinates.longitude >= area.northWest.longitude
    && coordinates.longitude <= area.southEast.longitude;
}
