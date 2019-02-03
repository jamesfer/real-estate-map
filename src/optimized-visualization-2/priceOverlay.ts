import { patch } from 'incremental-dom';
import { renderHeatmap } from './components/heatmap';
import { PropertyInformation } from './initMap';
import { State } from './store/state';
import { store } from './store/store';
import { Bounds } from './utils';

export class PriceOverlay extends google.maps.OverlayView {
  wrapper: HTMLElement;

  zoomListener: google.maps.MapsEventListener | null = null;

  dragListener: google.maps.MapsEventListener | null = null;

  constructor(public map: google.maps.Map, public properties: PropertyInformation[]) {
    super();
    this.setMap(map);
    this.wrapper = document.createElement('div');

    store.state$.subscribe((state) => {
      console.log('patching', state);
      patch<State>(this.wrapper, renderHeatmap, state);
    });
  }

  rebindEventListeners() {
    if (this.zoomListener) {
      this.zoomListener.remove();
    }
    if (this.dragListener) {
      this.dragListener.remove();
    }

    const map = this.getMap();
    this.dragListener = map.addListener('drag', () => this.onDrag());
    this.zoomListener = map.addListener('zoom', () => this.onZoom());
  }

  onAdd() {
    this.rebindEventListeners();
    this.getPanes().overlayLayer.appendChild(this.wrapper);
    store.setInitialState({
      map: this.map,
      properties: this.properties,
      zoom: this.getZoom(),
      bounds: this.getBounds(),
      lods: [],
    });
  }

  onRemove() {
    store.complete();
  }

  onZoom() {

  }

  onDrag() {

  }

  getZoom(): number {
    return this.map.getZoom();
  }

  getBounds(): Bounds {
    return (this.map.getBounds() as google.maps.LatLngBounds).toJSON();
  }
}
