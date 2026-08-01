import { calculateAndDrawLines } from "./lines.js";
import { calcPoetCities } from "./calcPoetCities.js";
import { calculateBubbles } from "./calcBubbles.js";
import { drawBubblesAndLegends } from "../drawMap/drawBubbles.js";
import { assertUnreachable } from "../assertUnreachable.js";

/**
 * Clears the map and redraws it for the current mode, filter and date range.
 * @param {LyricMap} map
 * @param {Data} data
 * @param {State} state
 */
export function updateMap(map, data, state) {
  clearMap(map);
  switch (state.currentMapMode) {
    case "placesMode":
    case "geoimaginaryMode": {
      const poetCities = calcPoetCities(data, state);
      const bubbles = calculateBubbles(state, data, poetCities);
      drawBubblesAndLegends(map, bubbles);
      break;
    }
    case "travelMode":
      calculateAndDrawLines(map, data, state);
      break;
    default:
      assertUnreachable(state.currentMapMode, "unrecognized map mode");
  }
  // axe-core is loaded globally by index.html, so accessibility can be checked
  // from the devtools console at any point: await axe.run()
}

/** @param {LyricMap} map */
function clearMap(map) {
  map.bubbleLayerGroup.clearLayers();
  map.legendLayerGroup.clearLayers();
  map.lineLayerGroup.clearLayers();
}
