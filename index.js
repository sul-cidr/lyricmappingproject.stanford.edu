import { initializeData } from "./js/calcData/data.js";
import { parseCsvs } from "./js/calcData/parseCsvs.js";
import {
  addMapModeEventListener,
  addPoetsEventListener,
  defaultMapState,
  updateMapMode
} from "./js/interface/interface.js";
import { initializeMap } from "./js/drawMap/initializeMap.js";
import { initializeSlider } from "./js/interface/slider.js";
import { createEssay, initializeCloseEssayClicks } from "./js/essay/essay.js";

async function main() {
  createEssay("home");
  initializeCloseEssayClicks();

  const map = initializeMap();
  const data = initializeData(await parseCsvs());
  /** @type {State} */
  const state = {
    map: defaultMapState("placesMode"),
    minDate: -800,
    maxDate: -400
  };

  addMapModeEventListener(map, data, state);
  addPoetsEventListener(map, data, state);

  updateMapMode(map, data, state, state.map.currentMapMode);
  initializeSlider(map, data, state);
}

main();
