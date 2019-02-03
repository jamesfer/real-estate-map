import { isEqual } from 'lodash';
import { arrayOverwrite, Bounds } from '../utils';
import { LodState, State } from './state';
import { Mutation } from './store';

export type MutationFactory<A> = (a: A) => Mutation<State>;

export const setZoom: MutationFactory<number> = zoom => state => ({
  ...state,
  zoom,
});

export const setBounds: MutationFactory<Bounds> = bounds => state => ({
  ...state,
  bounds,
});

export const removeLod: MutationFactory<LodState> = removedLod => state => ({
  ...state,
  lods: state.lods.filter(lod => lod !== removedLod),
});

export const updateLod: MutationFactory<LodState> = lod => state => {
  const index = state.lods.findIndex(({ zoom }) => zoom === lod.zoom);
  if (index === -1) {
    // If the lod doesn't exist, we can add it straight away
    return {
      ...state,
      lods: [
        ...state.lods,
        lod,
      ],
    };
  }

  // If the lod does already exist then we need to merge the tiles together
  const existingTiles = state.lods[index].tiles;
  return {
    ...state,
    lods: arrayOverwrite(state.lods, index, {
      ...lod,
      tiles: [
        ...existingTiles,
        ...lod.tiles.filter(tile => (
          !existingTiles.find(({ coordinates }) => isEqual(coordinates, tile.coordinates))
        )),
      ],
    }),
  };
};
