import { Asynchronous } from './asynchronous';
import { generateTileHash, Tile } from './models/tile';

export interface Renderer {
  renderTile(tile: Tile): Asynchronous<Uint8ClampedArray>;
}

export interface BaseRendererOptions {
  tileSize: number;
  interpolator: (exitingTiles: { tile: Tile, image: Uint8ClampedArray }[], target: Tile) => Uint8ClampedArray;
}

export interface CachingRendererOptions {
  renderer: Renderer,
}

// TODO implement renderer
// TODO handle tiles that have started rendering but not completed yet
export class CachingRenderer implements Renderer {
  private renderer: Renderer;

  private cache: { [k: string]: Uint8ClampedArray } = {};

  constructor(options: CachingRendererOptions) {
    this.renderer = options.renderer;
  }

  renderTile(tile: Tile) {
    const hash = generateTileHash(tile);
    const existingRender = this.cache[hash];
    if (existingRender) {
      return existingRender;
    }

    return this.renderer.renderTile(tile);
  }
}
