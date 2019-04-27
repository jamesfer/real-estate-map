import { BehaviorSubject, from, Observable, Subject, merge, ConnectableObservable, of } from 'rxjs';
import { AnonymousSubject, fromPromise } from 'rxjs/internal-compatibility';
import {
  ApiOptions,
  extractPropertyInformation,
  loadProperties,
  PropertyInformation,
} from '../real-estate-api';
import { CoordinateArea } from './models/coordinates';
import { generateTileHash, Tile } from './models/tile';
import {
  finalize,
  map,
  switchMap,
  tap,
  filter,
  publishReplay,
  reduce, catchError, mergeMap,
} from 'rxjs/operators';
import { ObservablePool, runWithPool, mergeMapPool } from './observable-pool';
import { calculateVisibleTiles, coordinateIsInsideArea, tileToArea } from './visible-tiles';


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
// function requestDataFor(
//   area: CoordinateArea,
//   searchSettings: ApiOptions,
// ): Observable<PropertyInformation> {
//   return runConcurrently(3, (stop, index) => (
//     fromPromise(loadProperties({
//       ...searchSettings,
//       boundingBox: [area.southEast.latitude, area.northWest.longitude, area.northWest.latitude, area.southEast.longitude], // [-37.886822810951536,145.00084641600324,-37.84772660035494,145.05946877623273],
//       page: index,
//       pageSize: 200,
//     })).pipe(
//       tap(({ _links }) => {
//         if (!_links || !_links.next || !_links.next.href) {
//           stop();
//         }
//       }),
//       map(extractPropertyInformation),
//       switchMap(properties => from(properties)),
//       // Filter out properties that have a non-numeric price
//       filter(({ price }) => typeof price === 'number' && !Number.isNaN(price)),
//     )
//   ));
// }

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

  constructor(
    private tileSize: number,
    private propertyBlockZoomLevel: number,
    private searchSettings: ApiOptions,
  ) { }

  fetchPropertiesInArea(area: CoordinateArea): Observable<PropertyInformation[]> {
    const tiles = calculateVisibleTiles(this.tileSize, this.propertyBlockZoomLevel, area);
    return merge(
      ...tiles.map(tile => this.fetchPropertiesInTile(tile)/*.pipe(finalize(() => console.log('Finalize fetch in area for tile', generateTileHash(tile))))*/),
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
}
