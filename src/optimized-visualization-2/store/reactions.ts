import { isEqual } from 'lodash';
import { from } from 'rxjs';
import { map, concatMap, distinct, distinctUntilChanged } from 'rxjs/operators';
import { degreesToTiles, dispatchOnEmit, generateSpiralCoordinates } from '../utils';
import { removeLod } from './mutations';
import { store } from './store';

// Remove empty lods
// store.state$.pipe(
//   map(({ lods, zoom }) => (
//     lods.filter(({ tiles, zoom: lodZoom }) => lodZoom !== zoom && tiles.length === 0)
//   )),
//   concatMap(lods => from(lods)),
//   dispatchOnEmit(removeLod)
// ).subscribe();

// Remove lods on a different zoom level
store.state$.pipe(
  map(({ lods, zoom }) => lods.filter(lod => lod.zoom !== zoom)),
  concatMap(lods => from(lods)),
  dispatchOnEmit(removeLod),
).subscribe();

// Update tiles on zoom or pan
store.state$.pipe(
  map(({ zoom, bounds }) => ({ zoom, bounds })),
  distinctUntilChanged(isEqual),
  map(({ zoom, bounds: { north, south, east, west } }) => {
    // Generate the list of tile coordinates
    const { x: minX, y: minY } = degreesToTiles({ latitude: north, longitude: west }, zoom);
    const { x: maxX, y: maxY } = degreesToTiles({ latitude: south, longitude: east }, zoom);
    return generateSpiralCoordinates(minX, maxX, minY, maxY);
  }),
  // TODO create a "add tiles at coordinates" mutation
  // dispatchOnEmit(),
);
