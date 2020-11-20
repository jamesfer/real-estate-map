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
  channel: Channel;
  page?: number;
  pageSize?: number;
  suburb?: string;
  sortType?: SortType;
  boundingBox?: [number, number, number, number];
  propertyTypes?: PropertyType[];
  priceRange?: {
    minimum?: number;
    maximum?: number;
  };
  bedroomsRange?: {
    minimum?: number;
    maximum?: number;
  };
  minimumBathrooms?: number;
  minimumCars?: number;
}
