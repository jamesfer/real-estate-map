import { BehaviorSubject, ConnectableObservable, merge, Observable, of, Subject } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import { finalize, map, mergeMap, publishReplay, reduce, tap } from 'rxjs/operators';
import {
  ApiOptions,
  extractPropertyInformation,
  loadProperties,
  PropertyInformation,
  SortType,
} from '../real-estate-api';
import { CoordinateArea } from './models/coordinates';
import { generateTileHash, Tile } from './models/tile';
import { mergeMapPool, ObservablePool } from './observable-pool';
import { calculateVisibleTiles, coordinateIsInsideArea, tileToArea } from './visible-tiles';
import { sortBy } from 'lodash';

function runConcurrently<T>(
  concurrency: number,
  operation: (stop: () => void, index: number) => Observable<T>,
): Observable<T> {
  const pool = new BehaviorSubject(concurrency);
  let index = 0;

  const stop = () => pool.complete();
  const allResults$ = new Subject<T>();

  pool.subscribe((count) => {
    if (count > 0) {
      // Decrement the pool count
      pool.next(pool.getValue() - 1);

      // Run the operation
      operation(stop, index)
        .pipe(
          // Increment the pool count
          finalize(() => pool.next(pool.getValue() + 1)),
        )
        .subscribe(allResults$);

      index += 1;
    }
  });

  return allResults$;
}

const propertyRequestPool = new ObservablePool(5);

/**
 * Loads the data from the server inside a given area.
 */
function requestDataWithPool(
  tile: Tile,
  area: CoordinateArea,
  searchSettings: ApiOptions,
): Observable<PropertyInformation[]> {
  const pageSubject = new BehaviorSubject<number>(1);
  return pageSubject.pipe(
    mergeMapPool(propertyRequestPool, page => (
      of(null).pipe(
        mergeMap(() => fromPromise(loadProperties({
          ...searchSettings,
          page,
          pageSize: 200,
          boundingBox: [area.southEast.latitude, area.northWest.longitude, area.northWest.latitude, area.southEast.longitude], // [-37.886822810951536,145.00084641600324,-37.84772660035494,145.05946877623273],
        })).pipe(
          tap(({ _links }) => {
            if (_links && _links.next && _links.next.href) {
              pageSubject.next(page + 1);
            } else {
              pageSubject.complete();
              pageSubject.unsubscribe();
            }
          }),
        ),
    )))),
    map(extractPropertyInformation),
    // Filter out properties that have a non-numeric price
    map(properties => properties.filter(({ price }) => typeof price === 'number' && !Number.isNaN(price))),
  );
}

export class PropertyLoader {
  private propertyCache: { [k: string]: Observable<PropertyInformation[]> } = { };

  private propertyRangeCache: Promise<{ min: number, max: number } | undefined> | undefined;

  constructor(
    private tileSize: number,
    private propertyBlockZoomLevel: number,
    private searchSettings: ApiOptions,
  ) { }

  async fetchPropertyRange(): Promise<{ min: number, max: number } | undefined> {
    if (!this.propertyRangeCache) {
      this.propertyRangeCache = Promise.all([this.fetchMin(), this.fetchMax()])
        .then(([min, max]) => (
          min && max ? (console.log(min.price, max.price), { min: min.price, max: max.price }) : undefined
        ));
    }
    return this.propertyRangeCache;
  }

  fetchPropertiesInArea(area: CoordinateArea): Observable<PropertyInformation[]> {
    const tiles = calculateVisibleTiles(this.tileSize, this.propertyBlockZoomLevel, area);
    return merge(
      ...tiles.map(tile => this.fetchPropertiesInTile(tile)),
    ).pipe(
      // We need to filter the results again because the cached blocks may not exactly line up with
      // the area
      map(properties => properties.filter(({ longitude, latitude }) => coordinateIsInsideArea({ longitude, latitude }, area))),
      reduce((all, properties) => [...all, ...properties]),
    );
  }

  fetchPropertiesInTile(tile: Tile): Observable<PropertyInformation[]> {
    const hash = generateTileHash(tile);
    if (this.propertyCache[hash]) {
      return this.propertyCache[hash];
    }

    const data$ = requestDataWithPool(tile, tileToArea(this.tileSize, tile), this.searchSettings);
    const published = data$.pipe(publishReplay()) as ConnectableObservable<PropertyInformation[]>;
    published.connect();
    this.propertyCache[hash] = published;
    return published;
  }

  setSearchSettings(searchSettings: ApiOptions) {
    this.searchSettings = searchSettings;
  }

  private async fetchMax() {
    const count = 200;
    const properties = await this.fetchSomeProperties(count, { sortType: SortType.priceDesc });
    const orderedProperties = sortBy(properties, 'price');

    const q1 = orderedProperties[Math.ceil(count * 0.25)]; // 510,000
    const q3 = orderedProperties[Math.floor(count * 0.75)]; // 20,000,000

    const max = q3.price + (q3.price - q1.price) * 1.5;
    return orderedProperties.reverse().find(property => property.price <= max);
  }

  private async fetchMin() {
    const count = 200;
    const properties = await this.fetchSomeProperties(count, { sortType: SortType.priceAsc });
    const orderedProperties = sortBy(properties, 'price');

    const q1 = orderedProperties[Math.ceil(count * 0.25)]; // 20,000
    const q3 = orderedProperties[Math.floor(count * 0.75)]; // 135,000

    const min = q1.price - (q3.price - q1.price) * 1.5;
    return properties.find(property => property.price >= min);
  }

  private async fetchSomeProperties(
    count: number,
    additionSettings: Partial<ApiOptions> = {},
  ): Promise<PropertyInformation[]> {
    const properties: PropertyInformation[] = [];
    while (properties.length < count) {
      const result = await loadProperties({
        ...this.searchSettings,
        ...additionSettings,
        pageSize: count,
        page: 1,
      });

      const propertiesPage = extractPropertyInformation(result);
      properties.push(...propertiesPage);

      if (!result._links.next.href) {
        break;
      }
    }
    return properties.slice(0, count);
  }
}
