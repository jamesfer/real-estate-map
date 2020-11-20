import './index.css';
import { ApiOptions, Channel } from '../shared/models/api-options';
import { CanvasOverlay } from './canvas-overlay';
import { HeatmapApiRenderer } from './heatmap-api-renderer';
import { BaseOrchestrator } from './orchestrator';
import { CachingRenderer } from './renderer';

const TILE_SIZE = 256;
const GAUSSIAN_RADIUS = 50;

const initialSearchSettings: ApiOptions = {
  channel: Channel.buy,
  // propertyTypes: [PropertyType.unitApartment],
  // bedroomsRange: { minimum: 2, maximum: 3 },
  // minimumBathrooms: 2,
};

google.maps.event.addDomListener(window, 'load', async () => {
  const element = document.getElementById('map');
  if (!element) {
    throw new Error('Could not find #map element');
  }
  const map = new google.maps.Map(element, {
    zoom: 13,
    center: { lat: -37.833552, lng: 145.033580 },
    mapTypeId: google.maps.MapTypeId.TERRAIN,
  });

  // const propertyLoader = new PropertyLoader(
  //   TILE_SIZE,
  //   PROPERTY_BLOCK_ZOOM_LEVEL,
  //   initialSearchSettings,
  // );
  // const heatmapRenderer = new HeatmapRenderer(GAUSSIAN_RADIUS, TILE_SIZE, propertyLoader);
  const heatmapApiRenderer = new HeatmapApiRenderer(
    'https://australia-southeast1-real-estate-map-1546133439056.cloudfunctions.net/heatmap-generator',
    GAUSSIAN_RADIUS,
    TILE_SIZE,
    initialSearchSettings,
  );
  const cachingRenderer = new CachingRenderer({ renderer: heatmapApiRenderer });
  const orchestrator = new BaseOrchestrator({
    renderer: cachingRenderer,
    tileSize: TILE_SIZE,
  });
  new CanvasOverlay(map, orchestrator);
});
