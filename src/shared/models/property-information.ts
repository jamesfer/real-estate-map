import { Channel, PropertyType } from './api-options';

export interface PropertyInformation {
  id: string;
  price: number;
  latitude: number;
  longitude: number;
  bedrooms?: number;
  bathrooms?: number;
  carSpaces?: number;
  propertyType: PropertyType;
  channel: Channel;
}
