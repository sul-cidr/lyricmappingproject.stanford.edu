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

    const geodesic = L.geodesic(
      [fromLatLng, toLatLng],
      {
        color: line.color,
        weight: line.weight,
        dashArray: dashArray
      }
    );
    const decorator = L.polylineDecorator(geodesic, {
      patterns: [
        {
          offset: 10,
          repeat: 200,
          symbol: L.Symbol.arrowHead({
            pathOptions: {
              color: line.color,
              fillOpacity: 1,
              weight: 0
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

    map.currentLayerGroup.addLayer(geodesic);
    map.currentLayerGroup.addLayer(decorator);
    map.currentLayerGroup.addLayer(transparentLine);
  }
}