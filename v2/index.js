import { initializeData } from './js/calcData/data.js';
import { parseCsvs } from './js/calcData/parseCsvs.js';
import { addMapModeEventListener, addPoetsEventListener, updateMapMode } from './js/interface/interface.js';
import { initializeMap } from './js/renderMap/initializeMap.js';

function main() {
  const map = initializeMap();
  map.currentLayerGroup = L.layerGroup();
  const data = {};
  const state = {
    "currentMapMode": "places_mode"
  };

  parseCsvs(data)
    .then(() => {  
      initializeData(data);

      addMapModeEventListener(map, data, state);
      addPoetsEventListener(map, data, state);

      updateMapMode(map, data, state);
    });
}

main();