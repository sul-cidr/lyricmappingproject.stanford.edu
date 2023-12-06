export function drawLines(map, calculatedLines) {
  map.lineLayerGroup.clearLayers();
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

    const geodesic = L.geodesic(
      [fromLatLng, toLatLng],
      {
        color: line.color,
        weight: line.weight,
        dashArray: dashArray
      }
    );
    const arrowSize = 3 * line.weight + 2;
    const decorator = L.polylineDecorator(geodesic, {
      patterns: [
        {
          offset: '25%',
          repeat: 250,
          symbol: L.Symbol.arrowHead({
            pixelSize: arrowSize,
            pathOptions: {
              color: line.color,
              fillOpacity: 1,
              weight: 0,
            }
          })
        }
      ]
    });
    const transparentLine = L.geodesic(
      [fromLatLng, toLatLng],
      {
        opacity: 0,
        weight: line.weight * 20
      }
    );

    if (line.popupHtml) {
      geodesic.bindPopup(line.popupHtml);
      transparentLine.bindPopup(line.popupHtml);
    }

    geodesic.bindTooltip(line.name);
    transparentLine.bindTooltip(line.name);

    map.lineLayerGroup.addLayer(geodesic);
    map.lineLayerGroup.addLayer(decorator);
    map.lineLayerGroup.addLayer(transparentLine);
  }
}