import {
  extractPropertyInformation,
  loadProperties,
  PropertyInformation,
} from './real-estate-api';
import { ApiOptions, SortType } from '../shared/models/api-options';

async function fetchSomeProperties(
  count: number,
  searchSettings: ApiOptions,
): Promise<PropertyInformation[]> {
  const properties: PropertyInformation[] = [];
  // Load as many pages as necessary to reach the desired count
  while (properties.length < count) {
    const result = await loadProperties({
      ...searchSettings,
      pageSize: count,
      page: 1,
    });

    const propertiesPage = extractPropertyInformation(result);
    properties.push(...propertiesPage);

    if (!result?._links?.next?.href) {
      break;
    }
  }
  return properties.slice(0, count);
}

async function fetchMaximumPrice(searchSettings: ApiOptions): Promise<number | undefined> {
  const count = 200;
  const properties = await fetchSomeProperties(count, {
    ...searchSettings,
    sortType: SortType.priceDesc,
  });
  const orderedPrices = properties.map(property => property.price);
  // const orderedPrices = sortBy(prices);

  const q1 = orderedPrices[Math.ceil(count * 0.25)]; // 510,000
  const q3 = orderedPrices[Math.floor(count * 0.75)]; // 20,000,000

  const max = q3 + (q3 - q1) * 1.5;
  return orderedPrices.reverse().find(price => price <= max);
}

async function fetchMinimumPrice(searchSettings: ApiOptions): Promise<number | undefined> {
  const count = 200;
  const properties = await fetchSomeProperties(count, {
    ...searchSettings,
    sortType: SortType.priceAsc,
  });
  const orderedPrices = properties.map(property => property.price);
  // const orderedProperties = sortBy(properties, 'price');

  const q1 = orderedPrices[Math.ceil(count * 0.25)]; // 20,000
  const q3 = orderedPrices[Math.floor(count * 0.75)]; // 135,000

  const min = q1 - (q3 - q1) * 1.5;
  return orderedPrices.find(price => price >= min);
}

export default async function fetchPropertyRange(
  searchSettings: ApiOptions,
): Promise<{ min: number, max: number } | undefined> {
  const [min, max] = await Promise.all([
    fetchMinimumPrice(searchSettings),
    fetchMaximumPrice(searchSettings),
  ]);

  return min != null && max != null ? { min, max } : undefined;
}
