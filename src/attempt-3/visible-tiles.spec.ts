import { degreesToPixels, pixelsToDegrees } from './visible-tiles';

describe('degreesToPixels', () => {
  it.each([
    [0, 0, 128, 128, 256],
    [0, 180, 256, 128, 256],
    [0, 180, 512, 256, 512],
    [40, 0, 128, 96.916, 256],
    [40, 40, 156.444, 96.916, 256],
  ])(
    'should convert (%d, %d) to (%d, %d) with tile size %d',
    (latitude, longitude, x, y, tileSize) => {
      const pixelCoords = degreesToPixels(tileSize, { latitude, longitude });
      expect(pixelCoords.x).toBeCloseTo(x);
      expect(pixelCoords.y).toBeCloseTo(y);
    },
  );
});

describe('pixelsToDegrees', () => {
  it.each([
    [128, 128, 0, 0, 256],
    [256, 128, 0, 180, 256],
    [512, 256, 0, 180, 512],
    [128, 96.916, 40, 0, 256],
    [156.444, 96.916, 40, 40, 256],
  ])(
    'should convert (%d, %d) to (%d, %d) with tile size %d',
    (x, y, latitude, longitude, tileSize) => {
      const worldCoordinates = pixelsToDegrees(tileSize, { x, y });
      expect(worldCoordinates.latitude).toBeCloseTo(latitude);
      expect(worldCoordinates.longitude).toBeCloseTo(longitude);
    },
  )
});
