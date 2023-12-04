import { initializeData } from './js/calcData/data.js';
import { parseCsvs } from './js/calcData/parseCsvs.js';
import { addMapModeEventListener, addPoetsEventListener, updateMapMode } from './js/interface/interface.js';
import { initializeMap } from './js/renderMap/initializeMap.js';
import { initializeSlider } from './js/interface/slider.js';

function main() {
  const map = initializeMap();
  map.currentLayerGroup = L.layerGroup();
  map.currentLegendLayerGroup = L.layerGroup();
  const data = {};
  const state = {
    "currentMapMode": "placesMode",
    "minDate": -800,
    "maxDate": -400
  };

  parseCsvs(data)
    .then(() => {
      initializeData(data);
      initializeSlider(map, data, state);

      addMapModeEventListener(map, data, state);
      addPoetsEventListener(map, data, state);

      updateMapMode(map, data, state);
    });


}

main();