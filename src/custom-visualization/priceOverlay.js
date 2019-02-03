class PriceOverlay extends google.maps.OverlayView {
  constructor(map, properties, sampleSize, aggregate) {
    super();
    this.properties = properties;
    this.sampleSize = sampleSize;
    this.aggregate = aggregate;
    this.canvas = null;
    this.context = null;
    this.setMap(map);
  }

  onAdd() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.width = this.getMap().getDiv().clientWidth;
    this.canvas.height = this.getMap().getDiv().clientHeight;
    this.context = this.canvas.getContext('2d');

    // Add the element to the "overlayLayer" pane.
    // const panes = this.getPanes();
    // panes.overlayLayer.appendChild(this.canvas);
    this.getMap().getDiv().appendChild(this.canvas);
  }

  draw() {
    // const sampleMap = this.sampleProperties();
    // this.drawSample(sampleMap);

    // const pixelMap = this.produceHeatmap();
    const pixelMap = this.produceGaussianHeatmap();
    // console.log(pixelMap);
    this.drawPixelMap(pixelMap);
  }

  onRemove() {
    this.canvas.parentNode.removeChild(this.canvas);
    this.canvas = null;
  }

  getBounds() {
    return this.getMap().getBounds();
  }

  calculateSampleCoordinates({ north, east, south, west }, latitude, longitude) {
    const xRatio = (longitude - west) / (east - west);
    const yRatio = 1 - ((latitude - south) / (north - south));
    if (xRatio >= 0 && xRatio < 1 && yRatio >= 0 && yRatio < 1) {
      return {
        x: Math.floor(xRatio * this.canvas.clientWidth / this.sampleSize),
        y: Math.floor(yRatio * this.canvas.clientHeight / this.sampleSize),
      };
    }
    return null;
  }

  produceGaussianPixelMap(width, height, { north, east, south, west }) {
    // Add the value of each property to the map
    const pixelMap = {};
    this.properties.forEach(({ latitude, longitude, price }) => {
      // Check if the price is value
      if (typeof price === 'number' && !Number.isNaN(price)) {
        // Determine the pixel coordinates of the property
        const xRatio = (longitude - west) / (east - west);
        const yRatio = 1 - ((latitude - south) / (north - south));
        if (xRatio >= 0 && xRatio < 1 && yRatio >= 0 && yRatio < 1) {
          const x = Math.floor(xRatio * width);
          const y = Math.floor(yRatio * height);
          if (!pixelMap[x]) {
            pixelMap[x] = {};
          }
          if (!pixelMap[x][y]) {
            pixelMap[x][y] = [];
          }
          pixelMap[x][y].push(price);
        }
      }
    });
    return pixelMap;
  }

  produceGaussianAggregateMap(pixelMap) {
    const aggregateMap = {};
    Object.keys(pixelMap).forEach((x) => {
      aggregateMap[x] = {};
      Object.keys(pixelMap[x]).forEach((y) => {
        aggregateMap[x][y] = mean(pixelMap[x][y]);
      });
    });
    return aggregateMap;
  }

  produceGaussianWeights(radius) {
    const radiusSquared = radius ** 2;
    const deviation = radius / 3;
    const deviationSquared = deviation ** 2;
    const gaussianWeights = [];
    for (let deltaX = -radius; deltaX <= radius; deltaX++) {
      for (let deltaY = -radius; deltaY <= radius; deltaY++) {
        const distance = deltaX ** 2 + deltaY ** 2;
        if (distance < radiusSquared) {
          const power = -distance / (2 * deviationSquared);
          const weight = Math.E ** power;
          // const weight = (Math.E ** power) / (2 * Math.PI * deviationSquared);
          gaussianWeights.push({ deltaX, deltaY, weight })
        }
      }
    }
    return gaussianWeights;
  }

  produceGaussianResultMap(width, height, aggregateMap, gaussianWeights) {
    const gaussianMap = {};

    Object.keys(aggregateMap).forEach((x) => {
      Object.keys(aggregateMap[x]).forEach((y) => {
        gaussianWeights.forEach(({ deltaX, deltaY, weight }) => {
          const xCoordinate = +x + deltaX;
          const yCoordinate = +y + deltaY;
          if (xCoordinate < 0 || xCoordinate > width || yCoordinate < 0 || yCoordinate > height) {
            return;
          }

          if (!gaussianMap[xCoordinate]) {
            gaussianMap[xCoordinate] = {};
          }
          if (!gaussianMap[xCoordinate][yCoordinate]) {
            gaussianMap[xCoordinate][yCoordinate] = { value: 0, weight: 0 };
          }
          gaussianMap[xCoordinate][yCoordinate].value += aggregateMap[x][y] * weight;
          gaussianMap[xCoordinate][yCoordinate].weight += weight;
        });
      });
    });

    Object.keys(gaussianMap).forEach((x) => {
      Object.keys(gaussianMap[x]).forEach((y) => {
        gaussianMap[x][y].value /= gaussianMap[x][y].weight;
      });
    });

    return gaussianMap;
  }

  produceGaussianHeatmap() {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Add the value of each property to the map
    const pixelMap = this.produceGaussianPixelMap(width, height, this.getBounds().toJSON());

    // Calculate the average of each set of coordinates in the pixel map
    const aggregateMap = this.produceGaussianAggregateMap(pixelMap);

    // Generate the gaussian matrix as an array
    const radius = 100;
    const gaussianWeights = this.produceGaussianWeights(radius);

    return this.produceGaussianResultMap(width, height, aggregateMap, gaussianWeights);
  }

  produceHeatmap() {
    // In degrees
    const falloff = 0.01;
    const { north, east, south, west } = this.getBounds().toJSON();
    // This should be the same for both directions
    const degreesPerPixel = Math.abs(east - west) / this.canvas.clientWidth;
    const radius = Math.ceil(falloff / degreesPerPixel);

    // Add the value of each property to the map
    const pixelMap = {};
    this.properties.forEach(({ latitude, longitude, price }) => {
      // Check if the price is value
      if (typeof price === 'number' && !Number.isNaN(price)) {
        // Determine the pixel coordinates of the property
        const xRatio = (longitude - west) / (east - west);
        const yRatio = 1 - ((latitude - south) / (north - south));
        if (xRatio >= 0 && xRatio < 1 && yRatio >= 0 && yRatio < 1) {
          const centerX = Math.floor(xRatio * this.canvas.clientWidth);
          const centerY = Math.floor(yRatio * this.canvas.clientHeight);

          // Write a weighted value to each of the pixels surrounding the middle property
          for (let x = centerX - radius; x < centerX + radius; x++) {
            for (let y = centerY - radius; y < centerY + radius; y++) {
              const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
              const weight = Math.max(0, 1 - distance / radius);

              if (weight > 0) {
                if (!pixelMap[x]) {
                  pixelMap[x] = {};
                }
                if (!pixelMap[x][y]) {
                  pixelMap[x][y] = [];
                }
                pixelMap[x][y].push({ value: price, weight });
              }
            }
          }
        }
      }
    });

    // Generate the aggregate for each sample
    const aggregateMap = {};
    Object.keys(pixelMap).forEach((x) => {
      aggregateMap[x] = {};
      Object.keys(pixelMap[x]).forEach((y) => {
        aggregateMap[x][y] = {
          value: this.weightedMean(pixelMap[x][y], this.easeLinear),
          // weight: Math.max(...pixelMap[x][y].map(({ weight }) => this.easeInQuad(weight))),
          weight: Math.min(1, pixelMap[x][y].reduce((sum, { weight }) => sum + this.easeLinear(weight), 0)),
        };
      });
    });

    return aggregateMap;
  }

  sampleProperties() {
    const bounds = this.getBounds();
    const jsonBounds = bounds.toJSON();

    // Collect all of the prices in each sample
    const sampleMap = {};
    this.properties.forEach(({ latitude, longitude, price }) => {
      const coordinates = this.calculateSampleCoordinates(jsonBounds, latitude, longitude);
      if (coordinates) {
        const { x, y } = coordinates;
        if (!sampleMap[x]) {
          sampleMap[x] = {};
        }
        if (!sampleMap[x][y]) {
          sampleMap[x][y] = [];
        }
        sampleMap[x][y].push(price);
      }
    });

    // Generate the aggregate for each sample
    const aggregateMap = {};
    Object.keys(sampleMap).forEach((x) => {
      aggregateMap[x] = {};
      Object.keys(sampleMap[x]).forEach((y) => {
        aggregateMap[x][y] = this.aggregate(sampleMap[x][y]);
      });
    });

    return aggregateMap;
  }

  easeLinear(t) {
    return t;
  }

  easeInQuad(t) {
    return t ** 2;
  }

  easeOutQuad(t) {
    return -t * (t - 2);
  }

  easeInQuart(t) {
    return t ** 4;
  }

  easeOutQuart(t) {
    return 1 - (t - 1) ** 4;
  }

  easeInOct(t) {
    return t ** 8;
  }

  easeOutOct(t) {
    return 1 - (t - 1) ** 8;
  }

  easeInOutTanh(t) {
    return 0.5 * Math.tanh(2 * Math.PI * t - Math.PI) + 0.5
  }

  interpolate(min, max, value, minResult, maxResult, easing) {
    return minResult + (maxResult - minResult) * easing((value - min) / (max - min));
  }

  colorGradient(min, max, value) {
    const lowColor = [0, 255, 0, 255 / 2];
    const highColor = [255, 0, 0, 255 / 2];
    return lowColor.map((color, index) => (
      Math.round(this.interpolate(min, max, value, color, highColor[index], this.easeLinear))
    ));
  }

  weightedColorGradient(min, max, { value, weight }) {
    const lowColor = [0, 255, 0];
    const highColor = [255, 0, 0];
    const color = lowColor.map((component, index) => (
      Math.round(this.interpolate(min, max, value, component, highColor[index], this.easeOutQuad))
    ));
    const alpha = Math.round(this.interpolate(0, 1, weight, 0, 255 * 0.6, this.easeLinear));
    return [...color, alpha];
  }

  drawPixelMap(pixelMap) {
    // Clear the canvas
    if (this.context) {
      const { min, max } = weightedLimits(pixelMap);

      const imageData = this.context.createImageData(this.canvas.clientWidth, this.canvas.clientHeight);

      const colours = [];
      // Iterate through every pixel
      for (let x = 0; x < imageData.width; x++) {
        if (pixelMap[x]) {
          for (let y = 0; y < imageData.height; y++) {
            if (pixelMap[x][y] && pixelMap[x][y].value > 0) {
              const color = this.weightedColorGradient(min, max, pixelMap[x][y]);
              colours.push({ x, y, color });
              // Write the color to the image data
              for (let i = 0; i < 4; i++) {
                imageData.data[y * imageData.width * 4 + x * 4 + i] = color[i];
              }
            }
          }
        }
      }

      // Draw image data to the canvas
      this.context.putImageData(imageData, 0, 0);
    }
  }

  drawSample(sampleMap) {
    // Clear the canvas
    if (this.context) {
      this.context.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

      const { min, max } = limits(sampleMap);

      const widthPixels = this.canvas.clientWidth;
      const heightPixels = this.canvas.clientHeight;
      for (let x = 0; x * this.sampleSize < widthPixels; x++) {
        if (sampleMap[x]) {
          for (let y = 0; y * this.sampleSize < heightPixels; y++) {
            if (sampleMap[x][y]) {
              const color = this.colorGradient(min, max, sampleMap[x][y]);
              this.context.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`;
              this.context.fillRect(x * this.sampleSize, y * this.sampleSize, this.sampleSize, this.sampleSize);
            }
          }
        }
      }
    }
  }

  weightedMean(values, easing) {
    let weightSum = 0;
    let valueSum = 0;
    values.forEach(({ value, weight }) => {
      const easedWeight = this.interpolate(0, 1, weight, 0, 1, easing);
      weightSum += easedWeight;
      valueSum += value * easedWeight;
    });
    return weightSum === 0 ? 0 : valueSum / weightSum;

    // const weightSum = values.reduce((sum, { weight }) => sum + weight, 0);
    // return weightSum === 0 ? 0
    //   : values.reduce((sum, { value, weight }) => sum + value * weight, 0) / weightSum;
  }
}

function getPropertiesInRange(properties, topLeft, bottomRight) {
  return properties.filter(({ latitude, longitude }) => (
    longitude >= topLeft.longitude && longitude < bottomRight.longitude
    && latitude < topLeft.latitude && latitude >= bottomRight.latitude
  ));
}

function getPropertiesInBounds(properties, bounds) {
  return properties.filter(({ latitude, longitude }) => (
    bounds.contains(new google.maps.LatLng(latitude, longitude))
  ))
}

function mean(values) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

// function doubleMean(values) {
//   const [totalValue, totalWeight] = values.reduce(([totalValue, totalWeight], { value, weight }) => [totalValue + value, totalWeight + weight], [0, 0]);
//   return { value: totalValue / values.length, weight: totalWeight / values.length };
// }

function limits(map) {
  let min = Infinity;
  let max = 0;
  Object.values(map).forEach(object => (
    Object.values(object).forEach((value) => {
      if (value < min) {
        min = value;
      }
      if (value > max) {
        max = value;
      }
    })
  ));
  return { min, max };
}

function weightedLimits(map) {
  let min = Infinity;
  let max = 0;
  Object.values(map).forEach(object => (
    Object.values(object).forEach(({ value }) => {
      if (value < min) {
        min = value;
      }
      if (value > max) {
        max = value;
      }
    })
  ));
  return { min, max };
}
