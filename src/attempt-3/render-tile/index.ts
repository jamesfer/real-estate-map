import { combineLatest, Observable, of } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import { switchMap } from 'rxjs/operators';
import RenderWorker from 'worker-loader!./render-worker';
import { PropertyInformation } from '../../real-estate-api';
import { Tile, tilesEqual } from '../models/tile';
import { PropertyLoader } from '../property-data';
import { Renderer } from '../renderer';
import { calculateGaussianWeights } from './calculate-gaussian-weights';
import { loadProperties } from './generate-price-grid';
import { OutputRenderWorkerMessage } from './render-worker';
import { WorkerPool } from './worker-pool';

export class HeatmapRenderer implements Renderer {
  private gaussianWeights = calculateGaussianWeights(this.radius);

  private workerPool = new WorkerPool(RenderWorker, {
    count: 10,
    // Release the worker when it completes work
    onWorkerCreated: (worker: Worker): void => {
      worker.addEventListener(
        'message',
        (message: OutputRenderWorkerMessage) => {
          if (message.data.name === 'renderComplete') {
            this.workerPool.release(worker);
          }
        },
        { passive: true },
      );
    },
  });

  constructor(
    private radius: number,
    private tileSize: number,
    private propertyLoader: PropertyLoader,
  ) { }

  renderTile(tile: Tile): Observable<Uint8ClampedArray> {
    return combineLatest(
      fromPromise(this.propertyLoader.fetchPropertyRange()),
      loadProperties(this.tileSize, this.radius, this.propertyLoader, tile),
    ).pipe(
      switchMap(([range, properties]) => (
        range
          ? fromPromise(this.renderInWorker(tile, range.min, range.max, properties))
          : of(new Uint8ClampedArray(this.tileSize * this.tileSize * 4))
      )),
    );
  }

  private async renderInWorker(tile: Tile, minPrice: number, maxPrice: number, properties: PropertyInformation[]): Promise<Uint8ClampedArray> {
    const worker = await this.workerPool.acquire();
    worker.postMessage({
      name: 'render',
      body: {
        tile,
        properties,
        minPrice,
        maxPrice,
        tileSize: this.tileSize,
        gaussianWeights: this.gaussianWeights,
      },
    });

    return new Promise<Uint8ClampedArray>((resolve) => {
      worker.addEventListener('message', function listener(message: OutputRenderWorkerMessage) {
        if (message.data.name === 'renderComplete' && tilesEqual(message.data.body.tile, tile)) {
          worker.removeEventListener('message', listener);
          resolve(message.data.body.image);
        }
      });
    });
  }
}
