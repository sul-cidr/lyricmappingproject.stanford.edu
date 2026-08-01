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
  const mapState = state.map;
  switch (mapState.currentMapMode) {
    case "placesMode":
    case "geoimaginaryMode": {
      const poetCities = calcPoetCities(data, state);
      const bubbles = calculateBubbles(state, data, poetCities);
      drawBubblesAndLegends(map, bubbles);
      break;
    }
    case "travelMode":
      // Narrowed here, so the travel map is handed a travel filter rather than
      // re-deriving one and having to consider filters it does not offer.
      calculateAndDrawLines(map, data, state, mapState.filter);
      break;
    default:
      assertUnreachable(mapState, "unrecognized map mode");
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
