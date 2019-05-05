import { first, map } from 'rxjs/operators';
import { PropertyInformation } from '../../real-estate-api';
import { Tile } from '../models/tile';
import { GaussianWeight } from './calculate-gaussian-weights';
import { drawImageData } from './draw-image-data';
import { computePriceGridForProperties } from './generate-price-grid';

export interface CustomMessage<N, T> extends MessageEvent {
  data: {
    name: N;
    body: T;
  };
}

export interface RenderMessage extends CustomMessage<'render', {
  tileSize: number;
  tile: Tile;
  maxPrice: number;
  minPrice: number;
  properties: PropertyInformation[];
  gaussianWeights: GaussianWeight[];
}> { }

export interface RenderCompleteMessage extends CustomMessage<'renderComplete', {
  tile: Tile,
  image: Uint8ClampedArray,
}> { }

export type InputRenderWorkerMessage = RenderMessage;

export type OutputRenderWorkerMessage = RenderCompleteMessage;

const worker: Worker = self as any;

worker.addEventListener('message', (message: InputRenderWorkerMessage) => {
  if (message.data.name === 'render') {
    const { tileSize, tile, maxPrice, minPrice, properties, gaussianWeights } = message.data.body;
    computePriceGridForProperties(tileSize, tile, properties, gaussianWeights).pipe(
      first(),
      map((priceGrid) => drawImageData(tileSize, minPrice, maxPrice, priceGrid)),
    ).subscribe((image) => {
      worker.postMessage({
        name: 'renderComplete',
        body: { tile, image, }
      });
    });
  }
});
