function debounce(fn) {
  const delay = 1000;
  let timeout = null;
  return (...args) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => fn(...args), delay);
  }
}

class PriceOverlay extends google.maps.OverlayView {
  constructor(map, properties) {
    super();
    this.setMap(map);

    this.debouncedRender = debounce(() => this.render());
    this.properties = properties;
    this.tileSize = 256;
    this.wrapper = null;

    this.containerDimensions = null;
    this.pixelsPerDegree = null;
    this.centerDegrees = null;
    this.centerOffset = null;

    this.domTiles = {};
  }

  onAdd() {
    // Create wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.style.position = 'absolute';
    this.getPanes().overlayLayer.appendChild(this.wrapper);
  }

  draw() {
    this.updateCoordinates();
    this.synchroniseWrapper();
    this.debouncedRender();
  }

  onRemove() {
    Object.values(this.domTiles).forEach(tile => this.removeDomTile(tile));
  }

  getBounds() {
    return this.getMap().getBounds().toJSON();
  }

  updateCoordinates() {
    const div = this.getMap().getDiv();
    const { north, south, east, west } = this.getBounds();

    this.containerDimensions = { x: div.clientWidth, y: div.clientHeight };
    this.pixelsPerDegree = div.clientHeight / Math.abs(north - south);
    const targetCenterDegrees = {
      x: Math.min(east, west) + Math.abs(east - west) / 2,
      y: Math.min(north, south) + Math.abs(north - south) / 2,
    };
    this.centerDegrees = this.centerDegrees
      ? snapToGrid(targetCenterDegrees, this.tileSize / this.pixelsPerDegree, this.centerDegrees)
      : targetCenterDegrees;
    this.centerOffset = {
      x: (this.centerDegrees.x - targetCenterDegrees.x) * this.pixelsPerDegree,
      y: (targetCenterDegrees.y - this.centerDegrees.y) * this.pixelsPerDegree,
    }
  }

  makeTileKey(x, y) {
    const xDegrees = Math.floor(10e4 * (this.centerDegrees.x + x / this.pixelsPerDegree));
    const yDegrees = Math.floor(10e4 * (this.centerDegrees.y + y / this.pixelsPerDegree));
    return `${xDegrees}.${yDegrees}`;
  }

  /**
   * Creates the tiles that make up the overlay.
   */
  createTileList() {
    const canvases = [];
    const bounds = this.getBounds();
    const tileSizeDegrees = this.tileSize / this.pixelsPerDegree;
    spiralLoopDegrees(this.centerDegrees, bounds, tileSizeDegrees, (xIndex, yIndex) => {
      const x = xIndex * this.tileSize - this.tileSize / 2;
      const y = yIndex * this.tileSize - this.tileSize / 2;
      canvases.push({ x, y, key: this.makeTileKey(x, y) });
    });
    return canvases;
  }

  removeDomTile(domTile) {
    domTile.canvas.parentNode.removeChild(domTile.canvas);
  }

  createDomTile({ key, x, y }) {
    const canvas = document.createElement('canvas');
    canvas.width = this.tileSize;
    canvas.height = this.tileSize;
    canvas.style.width = `${this.tileSize}px`;
    canvas.style.height = `${this.tileSize}px`;
    canvas.style.left = `${x}px`;
    canvas.style.top = `${y}px`;
    canvas.style.position = 'absolute';
    this.wrapper.appendChild(canvas);
    return { key, canvas, x, y };
  }

  calculatePricePixelMap(width, height, { north, east, south, west }) {
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

  mean(values) {
    return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  aggregateMapPixelMap(pixelMap) {
    const aggregateMap = {};
    Object.keys(pixelMap).forEach((x) => {
      aggregateMap[x] = {};
      Object.keys(pixelMap[x]).forEach((y) => {
        aggregateMap[x][y] = this.mean(pixelMap[x][y]);
      });
    });
    return aggregateMap;
  }

  calculateGaussianWeights(radius) {
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

  calculateGaussianResultMap(width, height, aggregateMap, gaussianWeights) {
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

  async calculatePriceValues(width, height, bounds, radius) {
    // Add the value of each property to the map
    const pixelMap = await this.calculatePricePixelMap(width, height, bounds);

    // Calculate the average of each set of coordinates in the pixel map
    const aggregateMap = await this.aggregateMapPixelMap(pixelMap);

    // Generate the gaussian matrix as an array
    const gaussianWeights = await this.calculateGaussianWeights(radius);

    return this.calculateGaussianResultMap(width, height, aggregateMap, gaussianWeights);
  }

  weightedLimits(map) {
    let minValue = Infinity;
    let maxValue = 0;
    let minWeight = Infinity;
    let maxWeight = 0;
    Object.values(map).forEach(object => (
      Object.values(object).forEach(({ value, weight }) => {
        if (value < minValue) {
          minValue = value;
        }
        if (value > maxValue) {
          maxValue = value;
        }
        if (weight < minWeight) {
          minWeight = weight;
        }
        if (weight > maxWeight) {
          maxWeight = weight;
        }
      })
    ));
    return { minValue, maxValue, minWeight, maxWeight };
  }

  easeLinear(t) {
    return t;
  }

  easeOutQuad(t) {
    return -t * (t - 2);
  }

  easeOutOct(t) {
    return 1 - (t - 1) ** 8;
  }

  interpolate(min, max, value, minResult, maxResult, easing) {
    return minResult + (maxResult - minResult) * easing(Math.max(0, Math.min(1, (value - min) / (max - min))));
  }

  colorGradient(min, max, value) {
    const lowColor = [0, 255, 0];
    const highColor = [255, 0, 0];
    return lowColor.map((component, index) => (
      Math.round(this.interpolate(min, max, value, component, highColor[index], this.easeOutQuad))
    ));
  }

  alphaGradient(min, max, weight) {
    return Math.round(this.interpolate(min, max, weight, 0, 255 * 0.6, this.easeOutOct));
  }

  drawPriceMap(canvas, priceMap, padding) {
    const context = canvas.getContext('2d');
    const imageData = context.createImageData(canvas.clientWidth, canvas.clientHeight);
    // const { minValue, maxValue, maxWeight } = this.weightedLimits(priceMap);
    const minValue = 100;
    const maxValue = 4000;
    const maxWeight = 10;

    // Iterate through every pixel
    for (let imageX = 0; imageX < imageData.width; imageX++) {
      const mapX = imageX + padding;
      if (priceMap[mapX]) {
        for (let imageY = 0; imageY < imageData.height; imageY++) {
          const mapY = imageY + padding;
          if (priceMap[mapX][mapY] && priceMap[mapX][mapY].value > 0) {
            const color = this.colorGradient(minValue, maxValue, priceMap[mapX][mapY].value);
            const alpha = this.alphaGradient(0, maxWeight, priceMap[mapX][mapY].weight);

            // Write the color to the image data
            for (let i = 0; i < 3; i++) {
              imageData.data[imageY * imageData.width * 4 + imageX * 4 + i] = color[i];
            }
            imageData.data[imageY * imageData.width * 4 + imageX * 4 + 3] = alpha;
          }
        }
      }
    }

    for (let x = 0; x < imageData.width; x++) {
      imageData.data[x * 4] = 0;
      imageData.data[x * 4 + 1] = 0;
      imageData.data[x * 4 + 2] = 0;
      imageData.data[x * 4 + 3] = 255;
      const y = imageData.height - 1;
      imageData.data[y * imageData.width * 4 + x * 4] = 0;
      imageData.data[y * imageData.width * 4 + x * 4 + 1] = 0;
      imageData.data[y * imageData.width * 4 + x * 4 + 2] = 0;
      imageData.data[y * imageData.width * 4 + x * 4 + 3] = 255;
    }

    for (let y = 0; y < imageData.height; y++) {
      imageData.data[y * imageData.width * 4] = 0;
      imageData.data[y * imageData.width * 4 + 1] = 0;
      imageData.data[y * imageData.width * 4 + 2] = 0;
      imageData.data[y * imageData.width * 4 + 3] = 255;
      const x = imageData.height - 1;
      imageData.data[y * imageData.width * 4 + x * 4] = 0;
      imageData.data[y * imageData.width * 4 + x * 4 + 1] = 0;
      imageData.data[y * imageData.width * 4 + x * 4 + 2] = 0;
      imageData.data[y * imageData.width * 4 + x * 4 + 3] = 255;
    }

    // Draw image data to the canvas
    context.putImageData(imageData, 0, 0);
  }

  async renderDomTile(domTile, radius, bounds) {
    const priceValues = await this.calculatePriceValues(
      this.tileSize + radius * 2,
      this.tileSize + radius * 2,
      bounds,
      radius,
    );
    this.drawPriceMap(domTile.canvas, priceValues, radius)
  }

  async renderDomTileAsync(domTile) {
    const radius = 100;
    const bounds = {
      north: this.centerDegrees.y - (domTile.y - radius) / this.pixelsPerDegree,
      south: this.centerDegrees.y - (domTile.y + this.tileSize + radius) / this.pixelsPerDegree,
      west: this.centerDegrees.x + (domTile.x - radius) / this.pixelsPerDegree,
      east: this.centerDegrees.x + (domTile.x + this.tileSize + radius) / this.pixelsPerDegree,
    };
    setTimeout(() => this.renderDomTile(domTile, radius, bounds), 0);
  }

  synchroniseDomTile({ canvas }, { x, y }) {
    canvas.style.left = `${x}px`;
    canvas.style.top = `${y}px`;
    canvas.style.position = 'absolute';
  }

  synchroniseWrapper() {
    // this.wrapper.style.left = `${this.centerOffset.x}px`;
    // this.wrapper.style.top = `${this.centerOffset.y}px`;
    this.wrapper.style.transform = `translate(${this.centerOffset.x}px, ${this.centerOffset.y}px)`;
  }

  synchroniseDom(tiles) {
    setTimeout(() => {
      console.log('Start tile rerender');
      // Initially flag every tile as for removal
      const toRemove = { ...this.domTiles };
      let created = 0;
      let updated = 0;
      const newDomTileMap = {};
      tiles.forEach((tile) => {
        // Remove the tile from the toRemove list
        delete toRemove[tile.key];

        if (tile.key in this.domTiles) {
          updated++;
          // Synchronise existing tiles and add them to the map
          this.synchroniseDomTile(this.domTiles[tile.key], tile);
          newDomTileMap[tile.key] = this.domTiles[tile.key];
        } else {
          created++;
          // Create new dom tiles
          const domTile = this.createDomTile(tile);
          this.renderDomTileAsync(domTile);
          newDomTileMap[tile.key] = domTile;
        }
      });

      // Remove all the flagged dom tiles
      Object.values(toRemove).forEach(domTile => this.removeDomTile(domTile));

      // console.log('created', created, 'updated', updated, 'removed', Object.keys(toRemove).length);
      // const existingKeys = Object.keys(this.domTiles);
      // existingKeys.sort();
      // const newKeys = tiles.map(({ key }) => key);
      // newKeys.sort();
      // console.log('existing', existingKeys);
      // console.log('new', newKeys);

      this.domTiles = newDomTileMap;
    }, 1000);
  }

  render() {
    // this.updateCoordinates();
    const tiles = this.createTileList();
    this.synchroniseDom(tiles);
  }
}

function spiralLoop(dimensions, tileSize, callback) {
  const maxLoops = Math.ceil(Math.max(
    dimensions.x / tileSize / 2 - 0.5,
    dimensions.y / tileSize / 2 - 0.5,
  ));
  for (let i = 0; i <= maxLoops; i++) {
    for (let x = -i; x <= i; x++) {
      callback(x, -i);
    }
    for (let y = -i + 1; y <= i; y++) {
      callback(i, y);
    }
    for (let x = i - 1; x >= -i; x--) {
      callback(x, i);
    }
    for (let y = i - 1; y > -i; y--) {
      callback(-i, y);
    }
  }
}

/**
 * Calls the callback with pixel coordinates that form a spiral pattern around the center point.
 * @param {Point} center Center of the spiral in degrees.
 * @param {Bounds} bounds North, south, east and west bounds of the spiral in degrees.
 * @param {number} tileSize Size of a tile in degrees.
 * @param {Function} callback
 */
function spiralLoopDegrees(center, bounds, tileSize, callback) {
  const maxLoops = Math.ceil(Math.max(
    Math.abs(center.y - bounds.north) / tileSize - 0.5,
    Math.abs(center.y - bounds.south) / tileSize - 0.5,
    Math.abs(center.x - bounds.west) / tileSize - 0.5,
    Math.abs(center.x - bounds.east) / tileSize - 0.5,
  ));

  for (let i = 0; i <= maxLoops; i++) {
    for (let x = -i; x <= i; x++) {
      callback(x, -i);
    }
    for (let y = -i + 1; y <= i; y++) {
      callback(i, y);
    }
    for (let x = i - 1; x >= -i; x--) {
      callback(x, i);
    }
    for (let y = i - 1; y > -i; y--) {
      callback(-i, y);
    }
  }
}

function snapToGrid(point, gridSize, reference) {
  return {
    x: reference.x + Math.round((point.x - reference.x) / gridSize) * gridSize,
    y: reference.y + Math.round((point.y - reference.y) / gridSize) * gridSize,
  };
}
