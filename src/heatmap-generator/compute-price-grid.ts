import { mean, mapValues } from 'lodash';
import { degreesToInnerTileCoordinates } from '../shared/visible-tiles';
import { Tile } from '../shared/models/tile';
import { PropertyInformation } from './real-estate-api';
import calculateGaussianWeights, { GaussianWeight } from './calculate-gaussian-weights';

export interface PixelGrid<T> {
  [x: string]: {
    [y: string]: T;
  };
}

/**
 * Inserts each properties price into the pixel closest to its longitude and latitude
 */
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

/**
 * Calculate the average of each cell in the price grid. The gaussian formula can only accept a
 * single value for each pixel.
 */
function aggregatePriceGrid(priceGrid: PixelGrid<number[]>): PixelGrid<number> {
  return mapValues(priceGrid, priceColumn => mapValues(priceColumn, priceCell => mean(priceCell)));
  // const aggregateGrid: PixelGrid<number> = {};
  // Object.keys(priceGrid).forEach(x => {
  //   aggregateGrid[x] = {};
  //   Object.keys(priceGrid[x]).forEach(y => {
  //     aggregateGrid[x][y] = mean(priceGrid[x][y]);
  //   });
  // });
  // return aggregateGrid;
}

function applyGaussianWeights(
  tileSize: number,
  aggregateMap: PixelGrid<number>,
  gaussianWeights: GaussianWeight[],
): PixelGrid<{ value: number, weight: number }> {
  const gaussianMap: PixelGrid<{ value: number, weight: number }> = {};

  // Apply the gaussian weights to each filled entry in the aggregate map
  Object.keys(aggregateMap).forEach((x) => {
    Object.keys(aggregateMap[x]).forEach((y) => {
      gaussianWeights.forEach(({ deltaX, deltaY, weight }) => {
        const xCoordinate = +x + deltaX;
        const yCoordinate = +y + deltaY;

        // Check if the coordinate is in bounds
        if (
          xCoordinate < 0
            || xCoordinate > tileSize
            || yCoordinate < 0
            || yCoordinate > tileSize
        ) {
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

function computePriceGridForProperties(
  tileSize: number,
  tile: Tile,
  properties: PropertyInformation[],
  gaussianWeights: GaussianWeight[],
): PixelGrid<{ value: number, weight: number }> {
  // Place each property's price onto a pixel grid
  const priceGrid = placePropertiesOnGrid(tileSize, tile, properties);

  // Aggregate the prices that appear on the same pixel
  const aggregatedGrid = aggregatePriceGrid(priceGrid);

  // Apply the gaussian weights to the aggregate grid
  return applyGaussianWeights(tileSize, aggregatedGrid, gaussianWeights);
}

export function computePriceGrid(
  tileSize: number,
  tile: Tile,
  gaussianRadius: number,
  properties: PropertyInformation[],
): PixelGrid<{ value: number, weight: number }> {
  const gaussianWeights = calculateGaussianWeights(gaussianRadius);
  return computePriceGridForProperties(tileSize, tile, properties, gaussianWeights);
}
