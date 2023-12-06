import { calculateAndDrawLines } from "./lines.js";
import { calcPoetCities } from "./calcPoetCities.js";
import { calculateBubbles } from "./calcBubbles.js";
import { drawBubblesAndLegends } from "../drawMap/drawBubbles.js";

export function updateMap(map, data, state) {
  if (state.currentMapMode === "placesMode" || state.currentMapMode === "geoimaginaryMode") {
    const poetCities = calcPoetCities(data, state);
    const bubbles = calculateBubbles(state, data, poetCities);
    drawBubblesAndLegends(map, bubbles);
  } else if (state.currentMapMode === "travelMode") {
    calculateAndDrawLines(map, data, state);
  } else {
    alert(`unrecognized map mode ${state.currentMapMode}`);
  }
}
