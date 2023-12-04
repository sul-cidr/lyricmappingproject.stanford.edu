import { LYRIC_WHITE, LYRIC_RED } from "../constants/colors.js";
import { calculateBubbles } from "../renderMap/calcBubbles.js";

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
    const location = L.latLng(
      bubble.city.lat,
      bubble.city.long
    );
    drawnBubbles.push(drawBubble(location, map, bubble));
  }

  map.addLayer(map.currentLayerGroup);
  return drawnBubbles;
}

function drawBubble(location, map, bubble) {
  const radius = calculateBubbleSize(map.getZoom(), bubble.price);
  const circle = L.circle(location, {
    color: LYRIC_WHITE,
    fillColor: LYRIC_RED,
    weight: 2,
    fillOpacity: 0.9,
    radius: radius
  });
  circle._price = bubble.price;
  map.currentLayerGroup.addLayer(circle);
  if (bubble.popupHtml)
    circle.bindPopup(bubble.popupHtml);
  circle.bindTooltip(bubble.city.infowindowName);
  return circle;
}

function drawLegends(map, bubbles) {
  map.currentLegendLayerGroup.clearLayers();

  for (const bubble of Object.values(bubbles)) {
    if (bubble.legend) {
      const location = L.latLng(
        bubble.city.lat,
        bubble.city.long
      );
      drawLegend(location, map, bubble);
    }
  }

  map.addLayer(map.currentLegendLayerGroup);
}

function drawLegend(location, map, bubble) {
  if (map.getZoom() >= minimumZoomToShowLegend(bubble.price)) {
    const textMarker = L.marker(location, {
      icon: L.divIcon({
        html: bubble.city.cityname,
        className: 'text-below-marker',
      })
    });
    map.currentLegendLayerGroup.addLayer(textMarker);
    textMarker.bindPopup(bubble.popupHtml);
    textMarker.bindTooltip(bubble.city.infowindowName);
  }
}

function minimumZoomToShowLegend(price) {
  if (price >= 22) return 0;
  if (price >= 20) return 7;
  if (price >= 18) return 8;
  if (price >= 15) return 9;
  return 10;
}

function calculateBubbleSize(zoom, price) {
  let multiplier;

  if (zoom <= 6) multiplier = 900;
  if (zoom === 7) multiplier = 500;
  if (zoom === 8) multiplier = 300;
  if (zoom === 9) multiplier = 200;
  if (zoom >= 10) multiplier = 100;

  return price * multiplier;
}