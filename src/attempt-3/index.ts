import { ApiOptions, Channel, PropertyType } from '../real-estate-api';
import './index.css';
import { CanvasOverlay } from './canvas-overlay';
import { Tile } from './models/tile';
import { BaseOrchestrator } from './orchestrator';
import { PropertyLoader } from './property-data';
import { HeatmapRenderer } from './render-tile';
import { CachingRenderer } from './renderer';

const TILE_SIZE = 256;
const GAUSSIAN_RADIUS = 50;
const PROPERTY_BLOCK_ZOOM_LEVEL = 12;

const initialSearchSettings: ApiOptions = {
  channel: Channel.buy,
  // propertyTypes: [PropertyType.unitApartment],
  // bedroomsRange: { minimum: 2, maximum: 3 },
  // minimumBathrooms: 2,
};

google.maps.event.addDomListener(window, 'load', async function () {
  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 13,
    center: { lat: -37.833552, lng: 145.033580 },
    mapTypeId: google.maps.MapTypeId.TERRAIN,
  });

  const propertyLoader = new PropertyLoader(
    TILE_SIZE,
    PROPERTY_BLOCK_ZOOM_LEVEL,
    initialSearchSettings,
  );
  const heatmapRenderer = new HeatmapRenderer(GAUSSIAN_RADIUS, TILE_SIZE, propertyLoader);
  const cachingRenderer = new CachingRenderer({ renderer: heatmapRenderer });
  const orchestrator = new BaseOrchestrator({
    renderer: cachingRenderer,
    tileSize: TILE_SIZE,
  });
  new CanvasOverlay(map, orchestrator);
});

