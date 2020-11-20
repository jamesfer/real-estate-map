import { ApiOptions } from '../shared/models/api-options';
import { Tile } from '../shared/models/tile';
import { Renderer } from './renderer';

export class HeatmapApiRenderer implements Renderer {
  constructor(
    public url: string,
    public radius: number,
    public tileSize: number,
    public searchOptions: ApiOptions,
  ) {}

  async renderTile(tile: Tile): Promise<Uint8ClampedArray> {
    const params: { [k: string]: string } = {
      searchOptions: JSON.stringify(this.searchOptions), // TODO
      tile: JSON.stringify(tile),
      radius: `${this.radius}`,
      tileSize: `${this.tileSize}`,
    };
    const response = await fetch(`${this.url}?${this.createQueryString(params)}`);
    const jsonData = await response.json();
    return new Uint8ClampedArray(jsonData);
  }

  private createQueryString(params: { [k: string]: string }): string {
    return Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
  }
}
