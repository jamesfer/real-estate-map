import { Tile } from '../shared/models/tile';
import { computePriceGrid } from './compute-price-grid';
import colorHeatmap from './color-heatmap';
import fetchProperties from './fetch-properties';
import fetchPropertyRange from './fetch-property-range';

export default async function createHeatmap(
  radius: number,
  tileSize: number,
  tile: Tile,
  searchSettings: any, // TODO
): Promise<Uint8ClampedArray> {
  // Fetch property range
  const range = await fetchPropertyRange(searchSettings);
  if (!range) {
    return new Uint8ClampedArray(4 * tileSize ** 2);
  }

  // Fetch all properties in the area
  const properties = await fetchProperties(tileSize, radius, searchSettings, tile);

  // Calculate price grid
  const priceGrid = computePriceGrid(tileSize, tile, radius, properties);

  // Render heatmap tile
  return colorHeatmap(tileSize, range.min, range.max, priceGrid);
}
