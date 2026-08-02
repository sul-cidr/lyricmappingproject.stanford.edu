import { calculateAndDrawLines } from "./lines.js";
import { calcPlacesPoetCities, calcGeoPoetCities } from "./calcPoetCities.js";
import { calculatePlacesBubbles, calculateGeoBubbles } from "./calcBubbles.js";
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
    // Each map runs its own pipeline end to end, narrowed once here. The two
    // bubble maps used to share one, which meant every step downstream had to
    // re-establish which of them it was working for.
    case "placesMode":
      drawBubblesAndLegends(
        map,
        calculatePlacesBubbles(data, mapState.filter, calcPlacesPoetCities(data, state, mapState.filter))
      );
      break;
    case "geoimaginaryMode":
      drawBubblesAndLegends(map, calculateGeoBubbles(data, calcGeoPoetCities(data, state, mapState.filter)));
      break;
    case "travelMode":
      // Narrowed here, so the travel map is handed a travel filter rather than
      // re-deriving one and having to consider filters it does not offer.
      calculateAndDrawLines(map, data, state, mapState.filter);
      break;
    default:
      assertUnreachable(mapState, "unrecognized map mode");
  }
}

/** @param {LyricMap} map */
function clearMap(map) {
  map.bubbleLayerGroup.clearLayers();
  map.legendLayerGroup.clearLayers();
  map.lineLayerGroup.clearLayers();
}
