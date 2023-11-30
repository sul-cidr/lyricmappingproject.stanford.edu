import { calculateAndDrawBubbles } from "./bubbles.js";
import { calculateAndDrawLines } from "./lines.js";
import { calcPoetCities } from "./calcPoetCities.js";

export function updateMap(map, data, state) {
  clearMap(map);
  if (state.currentMapMode === "places_mode" || state.currentMapMode === "geo_imaginary_mode") {
    const poetCities = calcPoetCities(data, state);
    calculateAndDrawBubbles(map, data, state, poetCities);
  } else if (state.currentMapMode === "travel_mode") {
    calculateAndDrawLines(map, data, state);
  } else {
    alert(`unrecognized map mode ${state.currentMapMode}`);
  }
}

function clearMap(map) {
  if (map.hasLayer(map.currentLayerGroup)) {
    map.currentLayerGroup.clearLayers();
  }
}