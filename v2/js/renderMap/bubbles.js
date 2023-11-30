import { LYRIC_WHITE, LYRIC_RED } from "../constants/colors.js";
import { calculateBubbles } from "./calcBubbles.js";

export function calculateAndDrawBubbles(map, data, state, poetsCities) {
  const bubbles = calculateBubbles(state, data, poetsCities);
  drawBubbles(map, bubbles);
}

export function drawBubbles(map, bubbles) {
  const drawnBubbles = [];

  for (const cityid in bubbles) {
    const bubble = bubbles[cityid];
    const location = L.latLng(
      bubble.city.lat,
      bubble.city.long
    );
    drawnBubbles.push(drawBubble(location, map, bubble));
    if (bubble.legend) {
      drawLegend(location, map, bubble);
    }

    map.addLayer(map.currentLayerGroup);
    map.on('zoomend', function () {
      for (const bubble of drawnBubbles) {
        bubble.setRadius(calculateBubbleSize(map, bubble._price))
      }
    });
  }
}

function drawBubble(location, map, bubble) {
  const radius = calculateBubbleSize(map, bubble.price);
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
  circle.bindTooltip(bubble.city.city_name);
  return circle;
}

function drawLegend(location, map, bubble) {
  if (bubble.price >= 25) {
    const textMarker = L.marker(location, {
      icon: L.divIcon({
        html: bubble.city.city_name,
        className: 'text-below-marker',
      })
    });
    map.currentLayerGroup.addLayer(textMarker);
    textMarker.bindPopup(bubble.popupHtml);
    textMarker.bindTooltip(bubble.city.city_name);
  }
}

function calculateBubbleSize(map, price) {
  const zoom = map.getZoom();
  let multiplier;

  if (zoom <= 6) multiplier = 900;
  if (zoom === 7) multiplier = 500;
  if (zoom === 8) multiplier = 300;
  if (zoom === 9) multiplier = 100;
  if (zoom >= 10) multiplier = 50;

  return price * multiplier;
}