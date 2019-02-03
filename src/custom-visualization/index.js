google.maps.event.addDomListener(window, 'load', initMap);

async function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 13,
    center: { lat: -37.833552, lng: 145.033580 },
    mapTypeId: 'terrain'
  });

  const properties = await loadPropertyData();
  // const propertiesSummary = summarisePropertyData(4, mean, properties);
  // const dataGrid = produceDataGrid([-37.893059, -37.795820], [144.965729, 145.077108], 3, mean, properties);
  createCustomOverlay(map, properties, 10, mean);
}

async function loadPropertyData() {
  const data = await fetch('../../output/melbourne.json');
  return data.json();
}

function mean(numbers) {
  return numbers.length === 0 ? 0 : numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

function median(numbers) {
  if (numbers.length === 0) {
    return 0;
  }

  const copy = [...numbers];
  copy.sort();
  return copy.length % 2 === 1
    // If the length is odd
    ? copy[(copy.length - 1) / 2]
    // If the length is even
    : mean([copy[copy.length / 2], copy[copy.length / 2 - 1]]);
}

function toPrecision(precision, number) {
  let scale = (10 ** precision);
  return Math.floor(number * scale) / scale;
}

function groupPropertiesByLocation(precision, properties) {
  return properties.reduce(
    (groups, property) => {
      const latitude = toPrecision(precision, property.latitude);
      const longitude = toPrecision(precision, property.longitude);
      const key = `${latitude}:${longitude}`;
      if (key in groups) {
        groups[key].properties.push(property);
      } else {
        groups[key] = {
          latitude,
          longitude,
          properties: [property],
        };
      }
      return groups;
    },
    {},
  );
}

function summarisePropertyData(precision, aggregate, properties) {
  const grouped = groupPropertiesByLocation(precision, properties);
  return Object.values(grouped).map(({ latitude, longitude, properties }) => ({
    latitude,
    longitude,
    price: aggregate(properties.map(({ price }) => price)),
  }));
}

function produceDataGrid(latitudeRange, longitudeRange, precision, aggregate, properties) {
  const propertyGroups = Object.values(groupPropertiesByLocation(precision, properties));
  const step = 10 ** -precision;
  const dataPoints = [];
  const latitudeStart = toPrecision(precision, latitudeRange[0]);
  const latitudeEnd = toPrecision(precision, latitudeRange[1]);
  const longitudeStart = toPrecision(precision, longitudeRange[0]);
  const longitudeEnd = toPrecision(precision, longitudeRange[1]);

  for (let longitude = longitudeStart; longitude < longitudeEnd; longitude += step) {
    for (let latitude = latitudeStart; latitude < latitudeEnd; latitude += step) {
      const group = propertyGroups.find(searchGroup => (
        searchGroup.longitude >= longitude && searchGroup.longitude < longitude + step
        && searchGroup.latitude >= latitude && searchGroup.latitude < latitude + step
      ));
      dataPoints.push({
        latitude,
        longitude,
        price: group ? aggregate(group.properties.map(({ price }) => price)) : 0,
      });
    }
  }
  return dataPoints;
}

function createCustomOverlay(map, properties, sampleWidth, aggregate) {
  return new PriceOverlay(map, properties, sampleWidth, aggregate);
  // return new PriceOverlay(map, [
  //   {
  //     latitude: -37.808295,
  //     longitude: 144.996736,
  //     price: 1200,
  //   },
  //   {
  //     latitude: -37.808295,
  //     longitude: 144.996736,
  //     price: 1200,
  //   },
  //   {
  //     latitude: -37.808295,
  //     longitude: 144.996736,
  //     price: 1200,
  //   },
  //   {
  //     latitude: -37.808295,
  //     longitude: 144.996736,
  //     price: 1200,
  //   },
  //   {
  //     latitude: -37.808295,
  //     longitude: 144.996736,
  //     price: 1200,
  //   },
  //   {
  //     latitude: -37.808295,
  //     longitude: 145.002,
  //     price: 300,
  //   },
  // ], sampleWidth, aggregate);
}

function createHeatmapLayer(map, properties) {
  return new google.maps.visualization.HeatmapLayer({
    map,
    dissipating: false,
    data: properties.map(({ price, latitude, longitude }) => ({
      location: new google.maps.LatLng(latitude, longitude),
      weight: price,
    })),
    // data: properties.map(({ price, latitude, longitude }) => (
    //   new google.maps.LatLng(latitude, longitude)
    // )),
    radius: 0.01,
  });
}
