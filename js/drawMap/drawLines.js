export function drawLines(map, calculatedLines) {
  for (const hash in calculatedLines) {
    const line = calculatedLines[hash];
    const fromCity = line.fromCity;
    const activeCity = line.toCity;
    const fromLatLng = L.latLng(fromCity.lat, fromCity.long);
    const toLatLng = L.latLng(activeCity.lat, activeCity.long);

    let dashArray;
    if (line.dotted) {
      dashArray = "8, 8";
    }
    const geodesic = L.geodesic([fromLatLng, toLatLng], { color: line.color, weight: line.weight, dashArray: dashArray });
    if (line.popupHtml)
      geodesic.bindPopup(line.popupHtml);
    geodesic.bindTooltip(line.name);
    const decorator = L.polylineDecorator(geodesic, {
      patterns: [
        { offset: 10, repeat: 200, symbol: L.Symbol.arrowHead({ pathOptions: { color: line.color, fillOpacity: 1, weight: 0 } }) }
      ]
    });
    map.currentLayerGroup.addLayer(geodesic);
    map.currentLayerGroup.addLayer(decorator);
  }
}