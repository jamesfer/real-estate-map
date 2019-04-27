import { PixelGrid } from './generate-price-grid';

// function weightedLimits(map) {
//   let minValue = Infinity;
//   let maxValue = 0;
//   let minWeight = Infinity;
//   let maxWeight = 0;
//   Object.values(map).forEach(object => (
//     Object.values(object).forEach(({ value, weight }) => {
//       if (value < minValue) {
//         minValue = value;
//       }
//       if (value > maxValue) {
//         maxValue = value;
//       }
//       if (weight < minWeight) {
//         minWeight = weight;
//       }
//       if (weight > maxWeight) {
//         maxWeight = weight;
//       }
//     })
//   ));
//   return { minValue, maxValue, minWeight, maxWeight };
// }

function easeLinear(t: number) {
  return t;
}

function easeOutQuad(t: number) {
  return -t * (t - 2);
}

function easeOutOct(t: number) {
  return 1 - (t - 1) ** 8;
}

function interpolate(
  min: number,
  max: number,
  value: number,
  minResult: number,
  maxResult: number,
  easing: (t: number) => number,
) {
  const multiplier = easing(Math.max(0, Math.min(1, (value - min) / (max - min))));
  return minResult + (maxResult - minResult) * multiplier;
}

function colorGradient(min: number, max: number, value: number) {
  const lowColor = [0, 255, 0];
  const highColor = [255, 0, 0];
  return lowColor.map((component, index) => (
    Math.round(interpolate(min, max, value, component, highColor[index], easeOutQuad))
  ));
}

function alphaGradient(min: number, max: number, weight: number) {
  return Math.round(interpolate(min, max, weight, 0, 255 * 0.6, easeOutOct));
}

export function drawImageData(
  tileSize: number, 
  priceMap: PixelGrid<{ value: number, weight: number }>,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(4 * tileSize * tileSize);

  // const { minValue, maxValue, maxWeight } = this.weightedLimits(priceMap);
  const minValue = 100;
  const maxValue = 4000;
  const maxWeight = 10;

  // Iterate through every pixel
  for (let x = 0; x < tileSize; x++) {
    if (priceMap[x]) {
      for (let y = 0; y < tileSize; y++) {
        if (priceMap[x][y] && priceMap[x][y].value > 0) {
          const color = colorGradient(minValue, maxValue, priceMap[x][y].value);
          const alpha = alphaGradient(0, maxWeight, priceMap[x][y].weight);

          // Write the color to the image data
          for (let i = 0; i < 3; i++) {
            data[y * tileSize * 4 + x * 4 + i] = color[i];
          }
          data[y * tileSize * 4 + x * 4 + 3] = alpha;
        }
      }
    }
  }
  //
  // // Draw borders for debugging
  // for (let x = 0; x < tileSize; x++) {
  //   data[x * 4] = 0;
  //   data[x * 4 + 1] = 0;
  //   data[x * 4 + 2] = 0;
  //   data[x * 4 + 3] = 255;
  //   const y = tileSize - 1;
  //   data[y * tileSize * 4 + x * 4] = 0;
  //   data[y * tileSize * 4 + x * 4 + 1] = 0;
  //   data[y * tileSize * 4 + x * 4 + 2] = 0;
  //   data[y * tileSize * 4 + x * 4 + 3] = 255;
  // }
  //
  // for (let y = 0; y < tileSize; y++) {
  //   data[y * tileSize * 4] = 0;
  //   data[y * tileSize * 4 + 1] = 0;
  //   data[y * tileSize * 4 + 2] = 0;
  //   data[y * tileSize * 4 + 3] = 255;
  //   const x = tileSize - 1;
  //   data[y * tileSize * 4 + x * 4] = 0;
  //   data[y * tileSize * 4 + x * 4 + 1] = 0;
  //   data[y * tileSize * 4 + x * 4 + 2] = 0;
  //   data[y * tileSize * 4 + x * 4 + 3] = 255;
  // }

  return data;
}
