export function initializeMap() {
  const map = L.map('map').setView([38.9, 26.38], 6);
  L.tileLayer('https://d3msn78fivoryj.cloudfront.net/orbis_tiles/{z}/{x}/{y}.jpg', {
    maxZoom: 9
  }).addTo(map);
  map.bubbleLayerGroup = L.layerGroup();
  map.legendLayerGroup = L.layerGroup();
  map.lineLayerGroup = L.layerGroup();
  map.addLayer(map.bubbleLayerGroup);
  map.addLayer(map.legendLayerGroup);
  map.addLayer(map.lineLayerGroup);
  return map;
}