import { LodState } from '../store/state';
import { renderTile } from './tile';

export function renderLod({ zoom, tiles }: LodState) {
  return (
    <div>
      {tiles.map(renderTile)}
    </div>
  )
}

// export class Lod extends Component {
//   store: Store<State>;
//
//   zoomLevel: number;
//
//   constructor(store: Store<State>, zoomLevel: number) {
//     const div = document.createElement('div');
//     super(div);
//     this.store = store;
//     this.zoomLevel = zoomLevel;
//   }
//
//
// }
