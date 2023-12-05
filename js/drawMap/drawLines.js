export function drawLines(map, calculatedLines) {
  drawLinesWithSampledRoute(map, calculatedLines);
}

// https://github.com/elfalem/Leaflet.curve/issues/59

function drawGeodesicLines(map, calculatedLines) {
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

function drawLinesWithCrappyArrows(map, calculatedLines) {
  for (const hash in calculatedLines) {
    const line = calculatedLines[hash];
    const fromCity = line.fromCity;
    const activeCity = line.toCity;
    const fromLatLng = [fromCity.lat, fromCity.long];
    const toLatLng = [activeCity.lat, activeCity.long];
    const midpointLatLng = getControlPoint(fromLatLng, toLatLng);

    let dashArray;
    if (line.dotted) {
      dashArray = "8, 8";
    }

    const bezierCommands =
      [
        'M', fromLatLng,
        'Q', midpointLatLng,
        toLatLng
      ];
    const curvedLine = L.curve(
      bezierCommands, {
      color: line.color,
      weight: line.weight,
      dashArray: dashArray
    });
    map.currentLayerGroup.addLayer(curvedLine);

    const sampleCount = 50;
    const samplingArray = [];
    for (let i = 0; i < 1; i += 1 / sampleCount) {
      samplingArray.push(i);
    }
    const curvedLinePath = curvedLine.trace(samplingArray);
    const transparentLine = L.polyline(
      curvedLinePath, {
      opacity: 0,
      weight: line.weight * 20
    });

    if (line.popupHtml) {
      curvedLine.bindPopup(line.popupHtml);
      transparentLine.bindPopup(line.popupHtml);
    }

    curvedLine.bindTooltip(line.name);
    transparentLine.bindTooltip(line.name);

    map.currentLayerGroup.addLayer(transparentLine);

    const decorator = L.polylineDecorator(
      curvedLinePath, {
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
    map.currentLayerGroup.addLayer(decorator);
  }
}

function drawLinesWithSampledRoute(map, calculatedLines) {
  for (const hash in calculatedLines) {
    const line = calculatedLines[hash];
    const fromCity = line.fromCity;
    const activeCity = line.toCity;
    const fromLatLng = [fromCity.lat, fromCity.long];
    const toLatLng = [activeCity.lat, activeCity.long];
    const midpointLatLng = getControlPoint(fromLatLng, toLatLng);

    let dashArray;
    if (line.dotted) {
      dashArray = "8, 8";
    }

    const bezierCommands =
      [
        'M', fromLatLng,
        'Q', midpointLatLng,
        toLatLng
      ];
    const curvedLine = L.curve(
      bezierCommands, {
      opacity: 0,
    });
    map.currentLayerGroup.addLayer(curvedLine);

    const sampleCount = 50;
    const samplingArray = [];
    for (let i = 0; i < 1; i += 1 / sampleCount) {
      samplingArray.push(i);
    }
    const curvedLinePath = curvedLine.trace(samplingArray);

    const sampledLine = L.polyline(
      curvedLinePath, {
      color: line.color,
      weight: line.weight,
      dashArray: dashArray
    });
    const transparentLine = L.polyline(
      curvedLinePath, {
      opacity: 0,
      weight: line.weight * 20
    });

    if (line.popupHtml) {
      sampledLine.bindPopup(line.popupHtml);
      transparentLine.bindPopup(line.popupHtml);
    }

    curvedLine.bindTooltip(line.name);
    transparentLine.bindTooltip(line.name);

    map.currentLayerGroup.addLayer(sampledLine);
    map.currentLayerGroup.addLayer(transparentLine);

    const decorator = L.polylineDecorator(
      sampledLine, {
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
    map.currentLayerGroup.addLayer(decorator);
  }
}

function getControlPoint(latlng1, latlng2) {
  // shamelessly stolen from https://gist.github.com/ryancatalani/6091e50bf756088bf9bf5de2017b32e6
  // blog post at https://ryancatalani.medium.com/creating-consistently-curved-lines-on-leaflet-b59bc03fa9dc

  var offsetX = latlng2[1] - latlng1[1],
    offsetY = latlng2[0] - latlng1[0];

  var r = Math.sqrt(Math.pow(offsetX, 2) + Math.pow(offsetY, 2)),
    theta = Math.atan2(offsetY, offsetX);

  var thetaOffset = (3.14 / 10);

  var r2 = (r / 2) / (Math.cos(thetaOffset)),
    theta2 = theta + thetaOffset;

  var midpointX = (r2 * Math.cos(theta2)) + latlng1[1],
    midpointY = (r2 * Math.sin(theta2)) + latlng1[0];

  var midpointLatLng = [midpointY, midpointX];
  return midpointLatLng;
}