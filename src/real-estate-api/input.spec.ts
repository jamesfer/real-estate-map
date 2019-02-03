import { Channel, extractPropertyInformation, loadProperties } from './index';

describe('loadProperties', () => {
  it('should load properties', async () => {
    const result = await loadProperties({ channel: Channel.rent, pageSize: 2 });
    expect(result.tieredResults).toHaveLength(1);
    expect(result.tieredResults[0].results).toHaveLength(2);
  });
});

describe('extractPropertyInformation', () => {
  it('should extract the key information about a property', async () => {
    const information = extractPropertyInformation(
      await loadProperties({ channel: Channel.rent, pageSize: 1 })
    );
    expect(information).toHaveLength(1);
    information.forEach((property) => {
      expect(property.channel).toBe(Channel.rent);
      expect(typeof property.propertyType).toBe('string');
      expect(typeof property.bathrooms).toBe('number');
      expect(property.bathrooms).not.toBeNaN();
      expect(typeof property.bedrooms).toBe('number');
      expect(property.bedrooms).not.toBeNaN();
      expect(typeof property.carSpaces).toBe('number');
      expect(property.carSpaces).not.toBeNaN();
      expect(typeof property.price).toBe('number');
      expect(property.price).not.toBeNaN();
      expect(typeof property.latitude).toBe('number');
      expect(property.latitude).not.toBeNaN();
      expect(typeof property.longitude).toBe('number');
      expect(property.longitude).not.toBeNaN();
    });
  });
});
