import { mean } from 'lodash';
import {
  combineLatest,
  ConnectableObservable,
  from,
  MonoTypeOperatorFunction,
  Observable,
  Subject,
  Subscriber,
  Subscription,
  TeardownLogic,
} from 'rxjs';
import {
  auditTime,
  debounceTime,
  distinctUntilChanged, filter,
  map,
  mergeAll,
  mergeMap,
  publish, startWith,
  takeUntil, tap,
} from 'rxjs/operators';
import { Bounds } from '../optimized-visualization-2/utils';
import { toObservable } from './asynchronous';
import { CoordinateArea } from './models/coordinates';
import { Point, pointsEqual } from './models/point';
import { generateTileHash, Tile, tilesEqual } from './models/tile';
import {
  calculateVisibleTiles,
  degreesToPixels, tilesToDegrees, tileToArea,
  tileToLocalPixels,
  worldPixelsToLocalPixels,
} from './visible-tiles';
import { Renderer } from './renderer';

interface Layer {
  zoom: number;
  position: Point;
  element: HTMLElement;
}

interface Canvas {
  tile: Tile;
  element: HTMLCanvasElement;
}

export interface BeginOrchestratorOptions {
  overlayView: google.maps.OverlayView;
  wrapper: HTMLElement;
}

export interface Orchestrator {
  begin(options: BeginOrchestratorOptions): void;
  reset(): void;
}

export interface OrchestratorOptions {
  tileSize: number;
  renderer: Renderer;
}

type MapEvent =
  | 'bounds_changed'
  | 'center_changed'
  | 'click'
  | 'dblclick'
  | 'drag'
  | 'dragend'
  | 'dragstart'
  | 'heading_changed'
  | 'idle'
  | 'maptypeid_changed'
  | 'mousemove'
  | 'mouseout'
  | 'mouseover'
  | 'projection_changed'
  | 'resize'
  | 'rightclick'
  | 'tilesloaded'
  | 'tilt_changed'
  | 'zoom_changed'

export class BaseOrchestrator implements Orchestrator {
  private readonly tileSize: number;

  private readonly renderer: Renderer;

  private wrapper: HTMLElement | null = null;

  private overlayView: google.maps.OverlayView | null = null;

  private subscription: Subscription | null = null;

  private unsubscribed$ = new Subject<void>();

  private layers: Layer[] = [];

  private canvases: Canvas[] = [];

  constructor(options: OrchestratorOptions) {
    this.tileSize = options.tileSize;
    this.renderer = options.renderer;
  }

  begin(options: BeginOrchestratorOptions) {
    this.overlayView = options.overlayView;
    this.wrapper = options.wrapper;
    this.subscription = this.initialize();
  }

  reset() {
    this.wrapper = null;
    this.overlayView = null;
    this.layers.forEach(layer => layer.element.remove());
    this.layers = [];
    this.canvases = [];
    this.unsubscribed$.next();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private initialize(): Subscription {
    const overlayView = this.overlayView;
    if (!overlayView) {
      throw new Error('Could not initialize map. Overlay view was null');
    }

    const zoom$ = this.observeEvent('zoom_changed').pipe(
      map(() => this.getMapZoom()),
      startWith(this.getMapZoom()),
    );

    const bounds$ = this.observeEvent('bounds_changed').pipe(
      map(() => this.getMapBounds()),
      startWith(this.getMapBounds()),
    );

    // Debounced map position
    const mapPosition$ = combineLatest(
      zoom$.pipe(distinctUntilChanged()),
      bounds$.pipe(distinctUntilChanged()),
    ).pipe(
      // TODO Debounce better. Needs to emit every X seconds with the latest value.
      auditTime(16),
      this.publishNow(),
    );

    // Tile coordinates that need to be rendered const visibleTiles$ = mapPosition$.pipe(
    const visibleTiles$ = mapPosition$.pipe(
      map(([zoom, bounds]) => this.getVisibleTiles(zoom, bounds)),
      this.publishNow(),
    );

    // Tiles that will need to be added to the view
    const unrenderedTiles$: Observable<Tile[]> = visibleTiles$.pipe(
      map(visibleTiles => visibleTiles.filter((tile) => (
        this.canvases.every(({ tile: existingTile }) => !tilesEqual(existingTile, tile))
      ))),
      this.publishNow(),
    );

    // Produce the image data for each tile. This is an observable of individual tiles so that each
    // one can be emitted as it is ready.
    const newTileRenderings$: Observable<Observable<{ tile: Tile, image: Uint8ClampedArray }>> = (
      unrenderedTiles$.pipe(
        // Convert the array of tiles into an observable of tiles
        mergeMap(unrenderedTiles => from(unrenderedTiles).pipe(
          // Map each unrendered tile to an observable with the rendering result
          map((visibleTile) => toObservable(this.renderer.renderTile(visibleTile)).pipe(
            map(image => ({ image, tile: visibleTile })),
            // Take each rendered observable until the tile is no longer in vision
            takeUntil(visibleTiles$.pipe(
              filter(tiles => tiles.every(tile => !tilesEqual(tile, visibleTile))),
            )),
            this.publishNow(),
          )),
        )),
      )
    );

    const repositionLayerSubscription = this.observeEvent('idle').subscribe(() => {
      this.layers.forEach((layer) => {
        if (this.updateLayerPosition(layer)) {
          this.updateTilePositions(layer);
        }
      });
    });

    const createNewTileSubscription = newTileRenderings$.pipe(
      mergeAll(),
    ).subscribe((renderedTile) => {
      // TODO don't return unneeded variables
      // Find a layer for it
      const layer = this.findOrCreateLayer(renderedTile.tile.zoom);

      // Create a canvas element
      const canvas = this.createAndRenderCanvas(renderedTile);
    });

    // Removes tiles that are out of vision
    const removeTileSubscription = visibleTiles$.subscribe((visibleTiles) => {
      this.canvases = this.canvases.filter((canvas) => {
        const zoom = this.getMapZoom();
        if (canvas.tile.zoom === zoom) {
          if (visibleTiles.some(tile => tilesEqual(canvas.tile, tile))) {
            return true;
          }
        } else {
          const visibleTilesAtZoom = this.getVisibleTiles(canvas.tile.zoom, this.getMapBounds());
          if (visibleTilesAtZoom.some(tile => tilesEqual(canvas.tile, tile))) {
            return true;
          }
        }

        canvas.element.remove();
        return false;
      });
    });

    // Removes tiles that have been covered by other tiles
    const removeCoveredTileSubscription = newTileRenderings$.pipe(
      mergeAll(),
    ).subscribe(() => {
      const zoom = this.getMapZoom();
      this.canvases = this.canvases.filter((canvas) => {
        if (canvas.tile.zoom === zoom) {
          return true;
        }

        // Find the tiles in the current zoom level required to cover this canvas
        const coveringTiles = calculateVisibleTiles(this.tileSize, zoom, tileToArea(this.tileSize, canvas.tile));

        // Check if some of the covering tiles have not been rendered
        if (coveringTiles.some(coveringTile => !this.canvases.some(canvas => tilesEqual(coveringTile, canvas.tile)))) {
          return true;
        }

        canvas.element.remove();
        return false;
      });
    });

    // TODO remove tiles
    // TODO remove layers

    return new Subscription(() => {
      createNewTileSubscription.unsubscribe();
      repositionLayerSubscription.unsubscribe();
      removeTileSubscription.unsubscribe();
      removeCoveredTileSubscription.unsubscribe();
    });
  }


  /**
   * Returns a list of tiles that are visible within the given bounds.
   */
  private getVisibleTiles(zoom: number, bounds: Bounds): Tile[] {
    return calculateVisibleTiles(this.tileSize, zoom, this.boundsToCoordinateArea(bounds));
  }

  // TODO remove when the utility functions can accept a bounds directly
  private boundsToCoordinateArea(bounds: Bounds): CoordinateArea {
    return {
      northWest: {
        longitude: bounds.west,
        latitude: bounds.north,
      },
      southEast: {
        longitude: bounds.east,
        latitude: bounds.south,
      },
    };
  }

  private createDiv(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    return wrapper;
  }

  /**
   * Creates a new canvas element but doesn't attach it to the document.
   */
  private createCanvasElement(id: string) {
    const canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.width = this.tileSize;
    canvas.height = this.tileSize;
    canvas.style.width = `${this.tileSize}px`;
    canvas.style.height = `${this.tileSize}px`;
    canvas.style.position = 'absolute';
    return canvas;
  }

  private findLayer(zoom: number): Layer | undefined {
    return this.layers.find(layer => layer.zoom === zoom);
  }

  private assignElementPosition(element: HTMLElement, position: Point): void {
    element.style.left = `${position.x}px`;
    element.style.top = `${position.y}px`;
  }

  private calculateLayerPosition(zoom: number): Point {
    const bounds = this.getMapBounds();
    // TODO more bugs when crossing over the international date line
    // Center point of the map in latitude and longitude
    const centerPoint = {
      latitude: mean([bounds.north, bounds.south]),
      longitude: mean([bounds.east, bounds.west]),
    };
    // The tile that covers the center point
    const [centerTile] = calculateVisibleTiles(this.tileSize, zoom, {
      northWest: centerPoint,
      southEast: centerPoint,
    });
    return centerTile.point;
  };

  private calculateLayerOffset(zoom: number, tilePoint: Point) {
    const bounds = this.getMapBounds();
    // TODO more bugs when crossing over the international date line
    // Center point of the map in latitude and longitude
    const centerPoint = {
      latitude: mean([bounds.north, bounds.south]),
      longitude: mean([bounds.east, bounds.west]),
    };
    // Local pixel coordinates of the top-left corner of the center tile
    const tilePointPixels = tileToLocalPixels(this.tileSize, tilePoint);
    // Local pixel coordinates of the center of the map
    const centerPointPixels = worldPixelsToLocalPixels(zoom, degreesToPixels(this.tileSize, centerPoint));

    return {
      x: tilePointPixels.x - centerPointPixels.x,
      y: tilePointPixels.y - centerPointPixels.y,
    };
  };

  private updateLayerPosition(layer: Layer): boolean {
    const position = this.calculateLayerPosition(layer.zoom);
    const offset = this.calculateLayerOffset(layer.zoom, position);
    if (!pointsEqual(offset, layer.position)) {
      this.assignElementPosition(layer.element, offset);
      layer.position = position;
      return true;
    }
    return false;
  }

  private createLayer(zoom: number): Layer {
    if (!this.wrapper) {
      throw new Error('Could not create a layer. Wrapper was null');
    }

    const element = this.createDiv();
    element.id = `layer-${zoom}`;
    this.wrapper.appendChild(element);

    const layer = { zoom, element, position: { x: 0, y: 0 } };
    this.updateLayerPosition(layer);
    this.layers.push(layer);
    return layer;
  }

  private findOrCreateLayer(zoom: number): Layer {
    return this.findLayer(zoom) || this.createLayer(zoom);
  }

  private findCanvas(tile: Tile) {
    const canvas = this.canvases.find(canvas => tilesEqual(tile, canvas.tile));
    return canvas ? canvas.element : undefined;
  };

  private calculateTilePosition(tile: Tile, layerPosition: Point) {
    return {
      x: (tile.point.x - layerPosition.x) * this.tileSize,
      y: (tile.point.y - layerPosition.y) * this.tileSize,
    };
  };

  private updateTilePosition(tile: Tile, layerPosition: Point, element: HTMLElement) {
    const position = this.calculateTilePosition(tile, layerPosition);
    this.assignElementPosition(element, position);
  }

  private createCanvas(tile: Tile) {
    const layer = this.findLayer(tile.zoom);
    if (!layer) {
      throw new Error(`Could not find layer for zoom ${tile.zoom}`);
    }

    const element = this.createCanvasElement(generateTileHash(tile));
    this.updateTilePosition(tile, layer.position, element);
    layer.element.appendChild(element);
    this.canvases.push({ tile, element });
    return element;
  };

  private findOrCreateCanvas(tile: Tile) {
    return this.findCanvas(tile) || this.createCanvas(tile);
  };

  private renderImageToCanvas(image: Uint8ClampedArray, canvas: HTMLCanvasElement) {
    // Render the image onto the canvas
    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Could not render image to canvas. Context was null');
      return;
    }

    const imageData = context.createImageData(this.tileSize, this.tileSize);
    imageData.data.set(image);
    context.putImageData(imageData, 0, 0);
  };

  private createAndRenderCanvas(renderedTile: { image: Uint8ClampedArray, tile: Tile; }) {
    const canvas = this.findOrCreateCanvas(renderedTile.tile);
    this.renderImageToCanvas(renderedTile.image, canvas);
    return canvas;
  }

  private updateTilePositions(
    layer: { zoom: number, position: Point, element: HTMLElement; },
  ): void {
    this.canvases.forEach((canvas) => {
      this.updateTilePosition(canvas.tile, layer.position, canvas.element);
    });
  }

  /**
   * Multicasts an observable and connects it immediately. Useful for converting observable chains
   * from cold to hot. Will automatically clean up the subscriptions when `this.unsubscribe$` emits.
   */
  private publishNow<T>(id?: string): MonoTypeOperatorFunction<T> {
    return (observable) => {
      const connectable = publish<T>()(observable.pipe(
        takeUntil(this.unsubscribed$),
      ));

      // This subscription will be cleaned up when the original observable completes
      connectable.connect();
      return connectable;
    };
  }

  private observeEvent<T = unknown>(event: MapEvent): Observable<T> {
    return Observable.create((subscriber: Subscriber<T>): TeardownLogic => {
      const listener = this.getPlainMap().addListener(event, (e) => subscriber.next(e));
      return () => listener.remove();
    });
  }

  private getMapZoom(): number {
    return this.getPlainMap().getZoom();
  }

  private getMapBounds(): Bounds {
    const bounds = this.getPlainMap().getBounds();
    if (!bounds) {
      throw Error('Invalid bounds');
    }

    return bounds.toJSON();
  }

  private getPlainMap(): google.maps.Map {
    if (!this.overlayView) {
      throw new Error('Could not retrieve map. Overlay view was null');
    }

    const map = this.overlayView.getMap();
    if (!(map instanceof google.maps.Map)) {
      throw Error('Cannot get the bounds of the map. Map class is incorrect.');
    }
    return map;
  }
}
