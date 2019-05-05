import { flatMap, map, filter, Dictionary } from 'lodash';

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

export enum SortType {
  priceAsc = 'price-asc',
  priceDesc = 'price-desc',
}

export interface ApiOptions {
  channel: Channel,
  page?: number,
  pageSize?: number,
  suburb?: string,
  sortType?: SortType,
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

export interface FeatureDetail {
  label: string,
  type: 'bedrooms' | 'bathrooms' | 'parkingSpaces',
  value: number,
}

export interface Features<T> {
  bedrooms?: T;
  bathrooms?: T;
  carSpaces?: T;
}

export interface PropertyResult {
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
  features?: {
    general?: Features<number>;
  };
  price?: Price,
  priceRange?: string,
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
  generalFeatures: Features<FeatureDetail>;
  applyOnline: true,
  status: object,
}

export interface ApiResult {
  prettyUrl: string,
  resolvedQuery: object,
  _links: { [k: string]: any },
  totalResultsCount: number,
  tieredResults: {
    tier: number,
    count: number,
    results: PropertyResult[],
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

  if (options.channel) {
    query.channel = options.channel;
  }

  if (options.sortType) {
    query.sortType = options.sortType;
  }

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
    query.filters.bedroomsRange = {};
    if (options.bedroomsRange.minimum !== undefined) {
      query.filters.bedroomsRange.minimum = `${options.bedroomsRange.minimum}`;
    }
    if (options.bedroomsRange.minimum !== undefined) {
      query.filters.bedroomsRange.maximum = `${options.bedroomsRange.maximum}`;
    }
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
  const url = `${apiSearchUrl}?query=${JSON.stringify(query)}`;
  const result = await fetch(url);

  if (result.status < 200 || result.status >= 300) {
    throw new Error('API request failed');
  }

  return result.json();
}

function parsePrice(string: string): number | null {
  // Matches numbers with comma separators and attempts to match numbers with . separators
  const matches = string.match(/\$(([0-9]+,[0-9,]+)|([0-9]+(\.[0-9]{3,})*)[km]?)/i);
  if (matches) {
    const [, price] = matches;
    let priceValue = +price.replace(/[., ]/g, '');

    if (price.endsWith('k') || price.endsWith('K')) {
      priceValue *= 1e3;
    }

    if (price.endsWith('m') || price.endsWith('M')) {
      priceValue *= 1e6;
    }

    if (!Number.isNaN(priceValue)) {
      return priceValue;
    }
  }
  return null;
}

function parsePriceRange(string: string): number | null {
  const matches = string.match(/(\$[0-9,.k]+\s*-\s*\$[0-9,.k]+)/i);
  if (matches) {
    const [, priceRange] = matches;
    const [minPrice, maxPrice] = priceRange.split('-');
    const minPriceValue = parsePrice(minPrice);
    const maxPriceValue = parsePrice(maxPrice);
    if (minPriceValue !== null && maxPriceValue !== null) {
      return (minPriceValue + maxPriceValue) / 2;
    }
  }
  return null;
}

function parsePriceOrRange(string: string): number | null {
  const priceRangeValue = parsePriceRange(string);
  if (priceRangeValue !== null) {
    return priceRangeValue;
  }

  const priceValue = parsePrice(string);
  if (priceValue !== null) {
    return priceValue;
  }

  return null;
}

function extractPrice(result: PropertyResult): number | null {
  if (result.price) {
    if (result.price.value) {
      return result.price.value;
    }

    if (result.price.display) {
      const price = parsePriceOrRange(result.price.display);
      if (price !== null) {
        return price;
      }
    }
  }

  if (result.priceRange) {
    return parsePriceOrRange(result.priceRange);
  }

  return null;
}

export interface PropertyInformation {
  id: string,
  price: number,
  latitude: number,
  longitude: number,
  bedrooms?: number,
  bathrooms?: number,
  carSpaces?: number,
  propertyType: PropertyType,
  channel: Channel,
}

export function extractPropertyInformation(result: ApiResult): PropertyInformation[] {
  return flatMap(result.tieredResults, tier => (
    filter(
      map(tier.results, (result) => {
        const price = extractPrice(result);
        if (!price) {
          return null;
        }

        const features: Features<number> = result.features && result.features.general
          ? result.features.general
          : {};

        return {
          price,
          ...features,
          id: result.listingId,
          latitude: result.address.location.latitude,
          longitude: result.address.location.longitude,
          propertyType: result.propertyType,
          channel: result.channel,
        };
      }),
      result => result !== null,
    ) as PropertyInformation[]
  ));
}




