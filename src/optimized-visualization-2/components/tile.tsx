import { TileState } from '../store/state';

export function renderTile(tile: TileState) {
  return (
    <canvas
      width="256"
      height="256"
      style={{ opacity: 'opacity' in tile ? tile.opacity : 1}}
    />
  );
}
