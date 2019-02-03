import { map } from 'rxjs/operators';
import { renderLod } from './lod';
import { State } from '../store/state';
import { store } from '../store/store';
import {
  addObserableListener,
  Bounds,
  debounce,
  degreesToTiles,
  generateSpiralCoordinates,
} from '../utils';

/**
 * Creates a list of tiles that should be displayed based on the current zoom level, map center and
 * viewport dimensions.
 */
export function createTileList({ north, south, east, west }: Bounds, zoom: number) {
  const { x: minX, y: minY } = degreesToTiles({ latitude: north, longitude: west }, zoom);
  const { x: maxX, y: maxY } = degreesToTiles({ latitude: south, longitude: east }, zoom);
  return generateSpiralCoordinates(minX, maxX, minY, maxY);
}



function updateTileList(bounds: Bounds, zoom: number) {
  // const tiles = createTileList(bounds, zoom);
  // store.dispatch((state) => {
  //   const newState = { ...state };
  //   tiles.forEach((tile) => {
  //     // Check if the tile exists
  //     newState.
  //   });
  // });
}

const debouncedUpdate = debounce(updateTileList);

store.state$.pipe(
  map(state => state.map),
  addObserableListener('zoom', debouncedUpdate),
  addObserableListener('drag', debouncedUpdate),
).subscribe();

export function renderHeatmap({ lods }: State) {
  console.log('heatmap rendered');
  return lods.map(renderLod);
}

// export class PriceHeatmap extends Component {
//   store = initializeStore<State>({ lods: [] });
//
//   lods: LodState[];
//
//   dispatchUpdateTileList = debounce(() => {
//     // TODO create updateTileList function
//     this.store.dispatch(updateTileList);
//   });
//
//   constructor(
//     overlayPane: HTMLElement,
//     public map: google.maps.Map,
//     public properties: PropertyInformation[],
//   ) {
//     super(overlayPane);
//
//     this.store.state$.pipe(rxjsMap(({ lods }) => lods))
//       .subscribe((lods) => {
//         this.lods = lods;
//       });
//
//     // this.store.state$.subscribe((state) => {
//       // this.update(state);
//     // });
//   }
//
//   render() {
//     return lods.map(lod => );
//   }
//
//   // TODO this isn't called from anywhere
//   draw() {
//     // this.debouncedRender();
//     this.dispatchUpdateTileList();
//   }
//
//   /**
//    * Synchronizes the list of existing tiles to match the state.
//    * @param state
//    */
//   // update({ lods }: State) {
//   //   // Initially flag every child to be removed
//   //   const lodsToRemove = { ...this.children };
//   //
//   //   lods.forEach((lod) => {
//   //     // Remove the lod from the list of children to be removed.
//   //     delete lodsToRemove[lod.zoom];
//   //
//   //     // Create a new lod if it doesn't exist
//   //     if (!this.children.find(lodElement => (lodElement as Lod).zoomLevel === lod.zoom)) {
//   //       this.addChild(new Lod(this.store, lod.zoom));
//   //     }
//   //   });
//   //
//   //   // Remove all the old lods
//   //   Object.values(lodsToRemove).forEach((lod) => {
//   //     this.removeChild(lod);
//   //   });
//   // }
//
//
// }
