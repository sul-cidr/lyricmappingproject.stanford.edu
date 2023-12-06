export function initializeMap() {
  const map = L.map('map').setView([38.9, 26.38], 6);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
    maxZoom: 20
  }).addTo(map);
  map.bubbleLayerGroup = L.layerGroup();
  map.legendLayerGroup = L.layerGroup();
  map.lineLayerGroup = L.layerGroup();
  map.addLayer(map.bubbleLayerGroup);
  map.addLayer(map.legendLayerGroup);
  map.addLayer(map.lineLayerGroup);
  return map;
}