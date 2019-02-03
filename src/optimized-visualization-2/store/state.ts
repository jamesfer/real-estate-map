import { PropertyInformation } from '../initMap';
import { Bounds, Point } from '../utils';

export interface TileState {
  opacity?: number,
  coordinates: Point,
  rendered: false,
}

export interface LodState {
  zoom: number,
  tiles: TileState[],
}

export interface State {
  properties: PropertyInformation[],
  lods: LodState[],
  map: google.maps.Map,
  zoom: number,
  bounds: Bounds,
}
