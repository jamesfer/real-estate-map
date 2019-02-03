import { Channel, PropertyType } from '../real-estate-api';
import { PriceOverlay } from './priceOverlay';
import propertyInformation from '../../output/melbourne.json';
import './index.css';

google.maps.event.addDomListener(window, 'load', initMap);

export interface PropertyInformation {
  price: number,
  latitude: number,
  longitude: number,
  bedrooms: number,
  bathrooms: number,
  carSpaces: number,
  propertyType: PropertyType,
  channel: Channel,
}

async function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 13,
    center: { lat: -37.833552, lng: 145.033580 },
    mapTypeId: google.maps.MapTypeId.TERRAIN,
  });

  createCustomOverlay(map, propertyInformation as any);
}

function createCustomOverlay(map: google.maps.Map, properties: PropertyInformation[]): PriceOverlay {
  return new PriceOverlay(map, properties);
  // return new PriceOverlay(map, [
  //   {
  //     latitude: -37.808295,
  //     longitude: 144.996736,
  //     price: 1200,
  //   },
  //   {
  //     latitude: -37.808295,
  //     longitude: 144.996736,
  //     price: 1200,
  //   },
  //   {
  //     latitude: -37.808295,
  //     longitude: 144.996736,
  //     price: 1200,
  //   },
  //   {
  //     latitude: -37.808295,
  //     longitude: 144.996736,
  //     price: 1200,
  //   },
  //   {
  //     latitude: -37.808295,
  //     longitude: 144.996736,
  //     price: 1200,
  //   },
  //   {
  //     latitude: -37.808295,
  //     longitude: 145.002,
  //     price: 300,
  //   },
  // ]);
}
