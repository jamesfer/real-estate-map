import { clamp } from 'lodash';
import { PixelGrid } from './compute-price-grid';

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

function easeOutSix(t: number) {
  return 1 - (t - 1) ** 6;
}

function easeOutOct(t: number) {
  return 1 - (t - 1) ** 8;
}

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t ** 2 : -1 + (4 - 2 * t) * t;
}

// function easeInOutQuart(t: number) {
//   return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t;
// }
//
// function easeOutQuint(t: number) {
//   return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t;
// }

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

function interpolateMultiple(
  min: number,
  max: number,
  value: number,
  ranges: {
    min: number,
    max: number,
  }[],
) {
  const t = easeOutSix(clamp((value - min) / (max - min), 0, 1));
  if (t === 1) {
    return ranges[ranges.length - 1].max;
  }

  const span = t * ranges.length;
  const interpolateCategory = Math.floor(span);
  const range = ranges[interpolateCategory];
  return range.min + (range.max - range.min) * (span - interpolateCategory);
}

function colorGradient(min: number, max: number, value: number): number[] {
  // const lowColor = [0, 255, 0];
  // const highColor = [255, 0, 0];
  // return lowColor.map((component, index) => (
  //   Math.round(interpolate(min, max, value, component, highColor[index], easeOutQuad))
  // ));
  const colors = [
    [0, 0, 255], // Blue
    [0, 255, 255], // Aqua
    [0, 255, 0], // Green
    [255, 255, 0], // Yellow
    [255, 0, 0], // Red
  ];
  const gradients = [1, 2, 3].map(component => colors.slice(1).map((color, index) => ({
    min: colors[index][component],
    max: color[component],
  })));
  return gradients.map(gradient => Math.round(interpolateMultiple(min, max, value, gradient)));
}

function alphaGradient(min: number, max: number, weight: number) {
  return Math.round(interpolate(min, max, weight, 0, 255 * 0.6, easeOutOct));
}

export default function colorHeatmap(
  tileSize: number,
  minPrice: number,
  maxPrice: number,
  priceMap: PixelGrid<{ value: number, weight: number }>,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(4 * tileSize * tileSize);
  const maxWeight = 10;

  // Iterate through every pixel
  for (let x = 0; x < tileSize; x += 1) {
    if (priceMap[x]) {
      for (let y = 0; y < tileSize; y += 1) {
        if (priceMap[x][y] && priceMap[x][y].value > 0) {
          const color: number[] = colorGradient(minPrice, maxPrice, priceMap[x][y].value);
          const alpha = alphaGradient(0, maxWeight, priceMap[x][y].weight);

          // Write the color to the image data
          for (let i = 0; i < 3; i += 1) {
            data[y * tileSize * 4 + x * 4 + i] = color[i];
          }
          data[y * tileSize * 4 + x * 4 + 3] = alpha;
        }
      }
    }
  }

  return data;
}
