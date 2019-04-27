import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Tile } from '../models/tile';
import { PropertyLoader } from '../property-data';
import { calculateGaussianWeights } from './calculate-gaussian-weights';
import { drawImageData } from './draw-image-data';
import { generatePriceGrid } from './generate-price-grid';
import { Renderer } from '../renderer';

export class HeatmapRenderer implements Renderer {
  private gaussianWeights = calculateGaussianWeights(this.radius);

  constructor(
    private radius: number,
    private tileSize: number,
    private propertyLoader: PropertyLoader,
  ) { }

  renderTile(tile: Tile): Observable<Uint8ClampedArray> {
    const priceGrid$ = generatePriceGrid(
      this.tileSize,
      this.radius,
      this.gaussianWeights,
      this.propertyLoader,
      tile,
    );

    return priceGrid$.pipe(
      map(priceGrid => drawImageData(this.tileSize, priceGrid)),
    );
  }
}
