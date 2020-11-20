import { memoize, range } from 'lodash';

export interface GaussianWeight {
  deltaX: number;
  deltaY: number;
  weight: number;
}

function calculateGaussianWeights(
  radius: number,
): GaussianWeight[] {
  const radiusSquared = radius ** 2;
  const deviation = radius / 3;
  const deviationSquared = deviation ** 2;
  const gaussianWeights: GaussianWeight[] = [];
  const deltas = range(-radius, radius);
  deltas.forEach(deltaX => deltas.forEach((deltaY) => {
    const distance = deltaX ** 2 + deltaY ** 2;
    if (distance < radiusSquared) {
      const power = -distance / (2 * deviationSquared);
      const weight = Math.E ** power;
      // const weight = (Math.E ** power) / (2 * Math.PI * deviationSquared);
      gaussianWeights.push({ deltaX, deltaY, weight });
    }
  }));
  return gaussianWeights;
}

export default memoize(calculateGaussianWeights);
