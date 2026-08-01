import { LYRIC_WHITE, LYRIC_RED } from "../constants/colors.js";

/** What is on the map now, read by the single zoomend handler below. */
let drawn = /** @type {{ circles: any[], bubbles: Record<number, DrawableBubble> }} */ ({
  circles: [],
  bubbles: {}
});
let listeningToZoom = false;

/**
 * Draws every city circle and its label, and re-sizes them on zoom.
 * @param {LyricMap} map
 * @param {Record<number, DrawableBubble>} bubbles
 */
export function drawBubblesAndLegends(map, bubbles) {
  drawn = { circles: drawBubbles(map, bubbles), bubbles };
  drawLegends(map, bubbles);

  // Bound once. Binding per redraw leaked a handler on every filter change, each
  // holding circles that had since been cleared off the map.
  if (listeningToZoom) return;
  listeningToZoom = true;
  map.on("zoomend", () => {
    const zoom = map.getZoom();
    for (const circle of drawn.circles) {
      circle.setRadius(calculateBubbleSize(zoom, circle._price));
    }
    drawLegends(map, drawn.bubbles);
  });
}

/**
 * @param {LyricMap} map
 * @param {Record<number, DrawableBubble>} bubbles
 * @returns {any[]} the Leaflet circles, for re-sizing on zoom
 */
function drawBubbles(map, bubbles) {
  /** @type {any[]} */
  const drawnBubbles = [];

  for (const bubble of Object.values(bubbles)) {
    if (bubble.city.lat && bubble.city.long) {
      const location = L.latLng(bubble.city.lat, bubble.city.long);
      drawnBubbles.push(...drawBubble(location, map, bubble));
    }
  }

  return drawnBubbles;
}

/**
 * Draws a visible circle plus a larger invisible one, so small bubbles are
 * still easy to click.
 * @param {any} location a Leaflet LatLng
 * @param {LyricMap} map
 * @param {DrawableBubble} bubble
 * @returns {any[]}
 */
function drawBubble(location, map, bubble) {
  const radius = calculateBubbleSize(map.getZoom(), bubble.price);
  const transparentCircle = L.circle(location, {
    opacity: 0,
    fillOpacity: 0,
    weight: 2,
    radius: radius * 3
  });
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

/**
 * @param {LyricMap} map
 * @param {Record<number, DrawableBubble>} bubbles
 */
function drawLegends(map, bubbles) {
  map.legendLayerGroup.clearLayers();
  for (const bubble of Object.values(bubbles)) {
    if (bubble.legend && bubble.city.lat && bubble.city.long) {
      const location = L.latLng(bubble.city.lat, bubble.city.long);
      drawLegend(location, map, bubble);
    }
  }
}

/**
 * @param {any} location a Leaflet LatLng
 * @param {LyricMap} map
 * @param {DrawableBubble} bubble
 */
function drawLegend(location, map, bubble) {
  if (map.getZoom() >= minimumZoomToShowLegend(bubble.price)) {
    const textMarker = L.marker(location, {
      icon: L.divIcon({
        html: bubble.city.cityname,
        className: "text-below-marker"
      })
    });
    map.legendLayerGroup.addLayer(textMarker);
    textMarker.bindPopup(bubble.popupHtml);
    textMarker.bindTooltip(bubble.city.infowindowName);
  }
}

/**
 * Bigger bubbles get labelled sooner as you zoom out.
 * @param {number} price
 * @returns {number}
 */
function minimumZoomToShowLegend(price) {
  if (price >= 22) return 0;
  if (price >= 20) return 7;
  if (price >= 18) return 8;
  return 9;
}

/**
 * @param {number} zoom
 * @param {number} price
 * @returns {number} radius in metres
 */
function calculateBubbleSize(zoom, price) {
  let multiplier = 900; // base zoom at 6 and below

  multiplier /= Math.pow(2, zoom - 6);

  return price * multiplier;
}
