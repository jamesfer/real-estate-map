import { flatMap, map } from 'lodash';
import fetch from 'node-fetch';
import { Dictionary } from '../utilityTypes';

const apiSearchUrl = 'https://services.realestate.com.au/services/listings/search';

export enum PropertyType {
  townhouse = 'townhouse',
  unitApartment = 'unit+apartment',
  house = 'house',
  retirement = 'retire',
  blockOfUnits = 'unitblock',
  acreage = 'acreage',
  villa = 'villa',
}

export enum Channel {
  rent = 'rent',
  buy = 'buy',
}

export interface ApiOptions {
  channel: Channel,
  page?: number,
  pageSize?: number,
  suburb?: string,
  boundingBox?: [number, number, number, number],
  propertyTypes?: PropertyType[],
  priceRange?: {
    minimum?: number,
    maximum?: number,
  },
  bedroomsRange?: {
    minimum?: number,
    maximum?: number,
  },
  minimumBathrooms?: number,
  minimumCars?: number,
}

export interface Price {
  display: string,
  value?: number,
}

export interface Feature {
  label: string,
  type: 'bedrooms' | 'bathrooms' | 'parkingSpaces',
  value: number,
}

export interface ApiResult {
  prettyUrl: string,
  resolvedQuery: object,
  _links: object,
  totalResultsCount: number,
  tieredResults: {
    tier: number,
    count: number,
    results: {
      prettyUrl: string,
      standard: boolean,
      midtier: boolean,
      lister: object,
      featured: boolean,
      _links: object,
      signature: boolean,
      channel: Channel,
      description: string,
      advertising: object,
      showAgencyLogo: boolean,
      title: string,
      listers: object[],
      features: {
        general: {
          bedrooms: number,
          bathrooms: number,
          parkingSpaces: number,
        }
      }
      price: Price,
      propertyType: PropertyType,
      nextInspectionTime: object,
      productDepth: string,
      calculator: object,
      images: object[],
      address: {
        streetAddress: string,
        locality: string,
        postcode: string,
        suburb: string,
        location: {
          latitude: number,
          longitude: number,
        },
        subdivisionCode: string,
        state: string,
        showAddress: boolean,
      },
      classicProject: boolean,
      agency: object,
      isSoldChannel: false,
      isBuyChannel: false,
      agencyListingId: string,
      signatureProject: boolean,
      propertyFeatures: {
        features: string[],
        section: string,
        label: string,
      }[],
      listingId: string,
      bond: Price,
      mainImage: object,
      dateAvailable: object,
      modifiedDate: object,
      inspectionsAndAuctions: object[],
      isRentChannel: boolean,
      generalFeatures: {
        bedrooms: Feature,
        bathrooms: Feature,
        parkingSpaces: Feature,
      },
      applyOnline: true,
      status: object,
    }[],
  }[],
}

function normalizeOptions(options: ApiOptions): Dictionary<any> {
  const query: Dictionary<any> = {
    channel: 'rent',
    pageSize: options.pageSize === undefined ? 500 : options.pageSize,
    page: options.page ? options.page : 1,
    filters: {
      surroundingSuburbs: 'false',
      excludeTier2: false,
      geoPrecision: 'address',
      excludeAddressHidden: 'true',
    },
  };

  if (options.suburb) {
    query.localities = [{ searchLocation: options.suburb }];
  }

  if (options.boundingBox) {
    query.boundingBoxSearch = options.boundingBox;
  }

  if (options.propertyTypes) {
    query.filters.propertyTypes = options.propertyTypes;
  }

  if (options.priceRange) {
    query.filters.priceRange = options.priceRange;
  }

  if (options.bedroomsRange) {
    query.filters.bedroomsRange = options.bedroomsRange;
  }

  if (options.minimumBathrooms) {
    query.filters.minimumBathroom = options.minimumBathrooms;
  }

  if (options.minimumCars) {
    query.filters.minimumCars = options.minimumCars;
  }

  return query;
}

export async function loadProperties(options: ApiOptions): Promise<ApiResult> {
  const query = normalizeOptions(options);
  const url = `${apiSearchUrl}?query=${encodeURIComponent(JSON.stringify(query))}`;
  const result = await fetch(url);

  if (result.status < 200 || result.status >= 300) {
    throw new Error('API request failed');
  }

  return result.json();
}

function convertPriceToNumber(price: Price): number {
  if (price.value) {
    return price.value;
  }
  const matches = price.display.match(/([0-9]+)/);
  if (matches) {
    const [, priceValue] = matches;
    return +priceValue;
  }
  return NaN;
}

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

export function extractPropertyInformation(result: ApiResult): PropertyInformation[] {
  return flatMap(result.tieredResults, tier => (
    map(tier.results, result => {
      return {
        price: convertPriceToNumber(result.price),
        latitude: result.address.location.latitude,
        longitude: result.address.location.longitude,
        bedrooms: result.features.general.bedrooms,
        bathrooms: result.features.general.bathrooms,
        carSpaces: result.features.general.parkingSpaces,
        propertyType: result.propertyType,
        channel: result.channel,
      };
    })
  ));
}




