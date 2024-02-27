import { LYRIC_WHITE, LYRIC_RED } from "../constants/colors.js";

export function drawBubblesAndLegends(map, bubbles) {
  const drawnBubbles = drawBubbles(map, bubbles);
  drawLegends(map, bubbles);

  map.on('zoomend', function () {
    const zoom = map.getZoom();
    for (const bubble of drawnBubbles) {
      bubble.setRadius(calculateBubbleSize(zoom, bubble._price))
    }
    drawLegends(map, bubbles);
  });
}

function drawBubbles(map, bubbles) {
  const drawnBubbles = [];

  for (const bubble of Object.values(bubbles)) {
    if (bubble.city.lat && bubble.city.long) {
      const location = L.latLng(
        bubble.city.lat,
        bubble.city.long
      );
      drawnBubbles.push(...drawBubble(location, map, bubble));
    }
  }

  return drawnBubbles;
}

function drawBubble(location, map, bubble) {
  const radius = calculateBubbleSize(map.getZoom(), bubble.price);
  const transparentCircle = L.circle(location,
    {
      opacity: 0,
      fillOpacity: 0,
      weight: 2,
      radius: radius * 3
    }
  );
  transparentCircle._price = bubble.price * 3;
  const circle = L.circle(location, {
    color: LYRIC_WHITE,
    fillColor: LYRIC_RED,
    weight: 2,
    fillOpacity: 0.9,
    radius: radius
  });
  circle._price = bubble.price;
  map.bubbleLayerGroup.addLayer(transparentCircle);
  map.bubbleLayerGroup.addLayer(circle);
  if (bubble.popupHtml) {
    transparentCircle.bindPopup(bubble.popupHtml);
    circle.bindPopup(bubble.popupHtml);
  }
  transparentCircle.bindTooltip(bubble.city.infowindowName);
  circle.bindTooltip(bubble.city.infowindowName);
  return [transparentCircle, circle];
}

function drawLegends(map, bubbles) {
  map.legendLayerGroup.clearLayers();
  for (const bubble of Object.values(bubbles)) {
    if (bubble.legend && bubble.city.lat && bubble.city.long) {
      const location = L.latLng(
        bubble.city.lat,
        bubble.city.long
      );
      drawLegend(location, map, bubble);
    }
  }
}

function drawLegend(location, map, bubble) {
  if (map.getZoom() >= minimumZoomToShowLegend(bubble.price)) {
    const textMarker = L.marker(location, {
      icon: L.divIcon({
        html: bubble.city.cityname,
        className: 'text-below-marker',
      })
    });
    map.legendLayerGroup.addLayer(textMarker);
    textMarker.bindPopup(bubble.popupHtml);
    textMarker.bindTooltip(bubble.city.infowindowName);
  }
}

function minimumZoomToShowLegend(price) {
  if (price >= 22) return 0;
  if (price >= 20) return 7;
  if (price >= 18) return 8;
  return 9;
}

function calculateBubbleSize(zoom, price) {
  let multiplier = 900; // base zoom at 6 and below

  multiplier /= Math.pow(2, zoom - 6);

  return price * multiplier;
}