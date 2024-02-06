import { calculateAndDrawLines } from "./lines.js";
import { calcPoetCities } from "./calcPoetCities.js";
import { calculateBubbles } from "./calcBubbles.js";
import { drawBubblesAndLegends } from "../drawMap/drawBubbles.js";

export function updateMap(map, data, state) {
  clearMap(map);
  if (state.currentMapMode === "placesMode" || state.currentMapMode === "geoimaginaryMode") {
    const poetCities = calcPoetCities(data, state);
    const bubbles = calculateBubbles(state, data, poetCities);
    drawBubblesAndLegends(map, bubbles);
  } else if (state.currentMapMode === "travelMode") {
    calculateAndDrawLines(map, data, state);
  } else {
    alert(`unrecognized map mode ${state.currentMapMode}`);
  }
  // uncomment following line to run accessibility checks while playing with the map
  // runAxe();
}

function clearMap(map) {
  map.bubbleLayerGroup.clearLayers();
  map.legendLayerGroup.clearLayers();
  map.lineLayerGroup.clearLayers();
}

function runAxe() {
  axe
    .run()
    .then(results => {
      if (results.violations.length) {
        throw new Error('Accessibility issues found');
      }
    })
    .catch(err => {
      console.error('Something bad happened:', err.message);
    });
}