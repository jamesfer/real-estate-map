import { mean, defer } from 'lodash';
import { from, MonoTypeOperatorFunction, Observable, of } from 'rxjs';
import {
  map,
  toArray,
  mergeMap,
  delay,
  mergeAll,
  reduce,
  switchMap,
  tap,
  finalize,
} from 'rxjs/operators';
import { PropertyInformation } from '../../real-estate-api';
import { CoordinateArea } from '../models/coordinates';
import { generateTileHash, Tile } from '../models/tile';
import { PropertyLoader } from '../property-data';
import {
  degreesToInnerTileCoordinates,
  degreesToPixels,
  localPixelsToWorldPixels,
  pixelsToDegrees,
  tileToArea,
  worldPixelsToLocalPixels,
} from '../visible-tiles';
import { GaussianWeight } from './calculate-gaussian-weights';

export interface PixelGrid<T> {
  [x: string]: {
    [y: string]: T;
  };
}
//
// function placePropertyOnGrid(
//   tileSize: number,
//   tile: Tile,
//   property: PropertyInformation,
// ): PixelGrid<number[]> {
//   const { price, longitude, latitude } = property;
//   const { x, y } = degreesToInnerTileCoordinates(tileSize, tile, { longitude, latitude });
//   return { [x]: { [y]: [price] } };
// }

function placePropertiesOnGrid(
  tileSize: number,
  tile: Tile,
  properties: PropertyInformation[],
): PixelGrid<number[]> {
  const pixelMap: PixelGrid<number[]> = {};
  properties.forEach(({ latitude, longitude, price }) => {
    const { x, y } = degreesToInnerTileCoordinates(tileSize, tile, { longitude, latitude });
    const intX = Math.floor(x);
    const intY = Math.floor(y);
    if (!pixelMap[intX]) {
      pixelMap[intX] = {};
    }
    if (!pixelMap[intX][intY]) {
      pixelMap[intX][intY] = [];
    }
    pixelMap[intX][intY].push(price);
  });
  return pixelMap;
}

function aggregatePriceGrid(priceGrid: PixelGrid<number[]>): PixelGrid<number> {
  const aggregateGrid: PixelGrid<number> = {};
  Object.keys(priceGrid).forEach(x => {
    aggregateGrid[x] = {};
    Object.keys(priceGrid[x]).forEach(y => {
      aggregateGrid[x][y] = mean(priceGrid[x][y]);
    });
  });
  return aggregateGrid;
}

export function expandArea(
  tileSize: number,
  zoom: number,
  area: CoordinateArea,
  radius: number,
): CoordinateArea {
  const localNorthWest = worldPixelsToLocalPixels(zoom, degreesToPixels(tileSize, area.northWest));
  const localSouthEast = worldPixelsToLocalPixels(zoom, degreesToPixels(tileSize, area.southEast));
  const expandedNorthWest = {
    x: localNorthWest.x - radius,
    y: localNorthWest.y - radius,
  };
  const expandedSouthEast = {
    x: localSouthEast.x + radius,
    y: localSouthEast.y + radius,
  };
  return {
    northWest: pixelsToDegrees(tileSize, localPixelsToWorldPixels(zoom, expandedNorthWest)),
    southEast: pixelsToDegrees(tileSize, localPixelsToWorldPixels(zoom, expandedSouthEast)),
  };
}

function applyGaussianWeights(tileSize: number, aggregateMap: PixelGrid<number>, gaussianWeights: GaussianWeight[]): PixelGrid<{ value: number, weight: number }> {
  const gaussianMap: PixelGrid<{ value: number, weight: number }> = {};

  // Apply the gaussian weights to each filled entry in the aggregate map
  Object.keys(aggregateMap).forEach((x) => {
    Object.keys(aggregateMap[x]).forEach((y) => {
      gaussianWeights.forEach(({ deltaX, deltaY, weight }) => {
        const xCoordinate = +x + deltaX;
        const yCoordinate = +y + deltaY;

        // Check if the coordinate is in bounds
        if (xCoordinate < 0 || xCoordinate > tileSize || yCoordinate < 0 || yCoordinate > tileSize) {
          return;
        }

        if (!gaussianMap[xCoordinate]) {
          gaussianMap[xCoordinate] = {};
        }
        if (!gaussianMap[xCoordinate][yCoordinate]) {
          gaussianMap[xCoordinate][yCoordinate] = { value: 0, weight: 0 };
        }
        gaussianMap[xCoordinate][yCoordinate].value += aggregateMap[x][y] * weight;
        gaussianMap[xCoordinate][yCoordinate].weight += weight;
      });
    });
  });

  // Finish calculating the weighted average of the value
  Object.keys(gaussianMap).forEach((x) => {
    Object.keys(gaussianMap[x]).forEach((y) => {
      gaussianMap[x][y].value /= gaussianMap[x][y].weight;
    });
  });

  return gaussianMap;
}
//
// function delayEach<T>(milliseconds: number): MonoTypeOperatorFunction<T> {
//   return observable => observable.pipe(
//     mergeMap(item => of(item).pipe(delay(milliseconds))),
//   );
// }
//
// function applyGaussianWeightsAsync(
//   tileSize: number,
//   aggregateMap: PixelGrid<number>,
//   gaussianWeights: GaussianWeight[],
// ): Observable<PixelGrid<{ value: number, weight: number }>> {
//   return from(Object.keys(aggregateMap)).pipe(
//     delayEach(0),
//     map((x) => {
//       const row: { [k: string]: { value: number, weight: number } } = {};
//       Object.keys(aggregateMap[x]).forEach((y) => {
//         gaussianWeights.forEach(({ deltaX, deltaY, weight }) => {
//           const xCoordinate = +x + deltaX;
//           const yCoordinate = +y + deltaY;
//
//           // Check if the coordinate is in bounds
//           if (xCoordinate < 0 || xCoordinate > tileSize || yCoordinate < 0 || yCoordinate > tileSize) {
//             return;
//           }
//
//           if (!row[yCoordinate]) {
//             row[yCoordinate] = { value: 0, weight: 0 };
//           }
//           row[yCoordinate].value += aggregateMap[x][y] * weight;
//           row[yCoordinate].weight += weight;
//         });
//       });
//
//       // Finish calculating the weighted average of the value
//       Object.keys(row).forEach((y) => {
//         row[y].value /= row[y].weight;
//       });
//
//       return { [x]: row };
//     }),
//     reduce((grid, row) => Object.assign(grid, row), {}),
//     tap(grid => console.log(grid)),
//   );
// }

export function computePriceGridForProperties(
  tileSize: number,
  tile: Tile,
  properties: PropertyInformation[],
  gaussianWeights: GaussianWeight[],
): Observable<PixelGrid<{ value: number, weight: number }>> {
  return of(placePropertiesOnGrid(tileSize, tile, properties)).pipe(
    delay(0),
    map(grid => aggregatePriceGrid(grid)),
    delay(0),
    map(grid => applyGaussianWeights(tileSize, grid, gaussianWeights)),
  );

  // Place each property's price onto a pixel grid
  // const priceGrid$ = placePropertiesOnGrid(tileSize, tile, properties);

  // Aggregate the prices that appear on the same pixel
  // const aggregatedGrid = aggregatePriceGrid(priceGrid);

  // Apply the gaussian weights to the aggregate grid
  // return applyGaussianWeights(tileSize, aggregatedGrid, gaussianWeights);
}

export function loadProperties(
  tileSize: number,
  radius: number,
  propertyLoader: PropertyLoader,
  tile: Tile,
): Observable<PropertyInformation[]> {
  // Expand the tile area so that we include properties near the edge in calculations
  const expandedArea = expandArea(tileSize, tile.zoom, tileToArea(tileSize, tile), radius);

  // Fetch all properties in the tile's area
  return propertyLoader.fetchPropertiesInArea(expandedArea);
}

// export function generatePriceGrid(
//   tileSize: number,
//   gaussianWeights: GaussianWeight[],
//   properties: PropertyInformation,
//   tile: Tile,
// ): Observable<PixelGrid<{ value: number, weight: number }>> {
//   // Expand the tile area so that we include properties near the edge in calculations
//   const expandedArea = expandArea(tileSize, tile.zoom, tileToArea(tileSize, tile), radius);
//
//   // Fetch all properties in the tile's area
//   return propertyLoader.fetchPropertiesInArea(expandedArea).pipe(
//     mergeMap((properties) => computePriceGridForProperties(tileSize, tile, properties, gaussianWeights)),
//   );
// }
