google.maps.event.addDomListener(window, 'load', initMap);

async function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 13,
    center: { lat: -37.833552, lng: 145.033580 },
    mapTypeId: 'terrain'
  });

  const properties = await loadPropertyData();
  createCustomOverlay(map, properties);
}

async function loadPropertyData() {
  const data = await fetch('../../output/melbourne.json');
  return data.json();
}

function createCustomOverlay(map, properties) {
  return new PriceOverlay(map, properties);
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
  // ]);
}
