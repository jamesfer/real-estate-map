import { Asynchronous } from './asynchronous';
import { generateTileHash, Tile } from '../shared/models/tile';

export interface Renderer {
  renderTile(tile: Tile): Asynchronous<Uint8ClampedArray>;
}

export interface CachingRendererOptions {
  renderer: Renderer;
}

export class CachingRenderer implements Renderer {
  private renderer: Renderer;

  private cache: { [k: string]: Asynchronous<Uint8ClampedArray> } = {};

  constructor(options: CachingRendererOptions) {
    this.renderer = options.renderer;
  }

  renderTile(tile: Tile): Asynchronous<Uint8ClampedArray> {
    const hash = generateTileHash(tile);
    if (!(hash in this.cache)) {
      this.cache[hash] = this.renderer.renderTile(tile);
    }

    return this.cache[hash];
  }
}
