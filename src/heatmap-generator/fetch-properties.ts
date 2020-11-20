import { BehaviorSubject, Observable } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import { map, mergeMap, tap, toArray } from 'rxjs/operators';
import {
  degreesToPixels,
  localPixelsToWorldPixels,
  pixelsToDegrees,
  tileToArea,
  worldPixelsToLocalPixels,
} from '../shared/visible-tiles';
import { CoordinateArea } from '../shared/models/coordinates';
import { Tile } from '../shared/models/tile';
import {
  extractPropertyInformation,
  loadProperties,
  PropertyInformation,
} from './real-estate-api';
import { flatten } from 'lodash';
import { ApiOptions } from '../shared/models/api-options';

function expandArea(
  tileSize: number,
  zoom: number,
  area: CoordinateArea,
  radius: number,
): CoordinateArea {
  const localNorthWest = worldPixelsToLocalPixels(zoom, degreesToPixels(tileSize, area.northWest));
  const localSouthEast = worldPixelsToLocalPixels(zoom, degreesToPixels(tileSize, area.southEast));
  const expandedNorthWest = {
    x: localNorthWest.x - radius,
    y: localNorthWest.y - radius,
  };
  const expandedSouthEast = {
    x: localSouthEast.x + radius,
    y: localSouthEast.y + radius,
  };
  return {
    northWest: pixelsToDegrees(tileSize, localPixelsToWorldPixels(zoom, expandedNorthWest)),
    southEast: pixelsToDegrees(tileSize, localPixelsToWorldPixels(zoom, expandedSouthEast)),
  };
}

/**
 * Loads the data from the server inside a given area.
 */
function fetchPropertiesInArea(
  area: CoordinateArea,
  searchSettings: ApiOptions,
): Observable<PropertyInformation[]> {
  const pageSubject = new BehaviorSubject<number>(1);
  return pageSubject.pipe(
    mergeMap(page => (
      fromPromise(loadProperties({
        ...searchSettings,
        page,
        pageSize: 100,
        boundingBox: [
          area.southEast.latitude,
          area.northWest.longitude,
          area.northWest.latitude,
          area.southEast.longitude,
        ], // [-37.886822810951536,145.00084641600324,-37.84772660035494,145.05946877623273],
      })).pipe(
        // Push the next page onto the subject, if there are more pages to fetch
        tap(({ _links }) => {
          if (_links && _links.next && _links.next.href) {
            pageSubject.next(page + 1);
          } else {
            pageSubject.complete();
            pageSubject.unsubscribe();
          }
        }),
      )
    )),
    map(extractPropertyInformation),
    // Filter out properties that have a non-numeric price
    map(properties => properties.filter(({ price }) => (
      typeof price === 'number' && !Number.isNaN(price)
    ))),
  );
}

export default async function fetchProperties(
  tileSize: number,
  radius: number,
  searchSettings: ApiOptions,
  tile: Tile,
): Promise<PropertyInformation[]> {
  // Expand the tile area so that we include properties near the edge in calculations
  const expandedArea = expandArea(tileSize, tile.zoom, tileToArea(tileSize, tile), radius);
  return fetchPropertiesInArea(expandedArea, searchSettings)
    .pipe(toArray(), map(flatten))
    .toPromise();
}
