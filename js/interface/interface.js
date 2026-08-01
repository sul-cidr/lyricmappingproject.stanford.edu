import { updateMap } from "../renderMap/updateMap.js";
import { createGeoImaginaryInterfaceHtml } from "./geoImaginaryInterface.js";
import { createPlacesInterfaceHtml } from "./placesInterface.js";
import { createTravelInterfaceHtml } from "./travelInterface.js";
import { assertUnreachable } from "../assertUnreachable.js";

/**
 * Redraws the map whenever a different filter is picked in the control bar.
 * @param {LyricMap} map
 * @param {Data} data
 * @param {State} state
 */
export function addPoetsEventListener(map, data, state) {
  /** @type {HTMLElement} */ (document.querySelector('#poetsSelector')).addEventListener('click', () => {
    const currentSelected = /** @type {HTMLInputElement} */ (document.querySelector('div.buttonContainer input:checked')).id;
    if (state.selectedId !== currentSelected) {
      state.selectedId = currentSelected;
      updateMap(map, data, state);
    }
  });
}

/**
 * Rebuilds the control bar and map whenever a different map mode is picked.
 * @param {LyricMap} map
 * @param {Data} data
 * @param {State} state
 */
export function addMapModeEventListener(map, data, state) {
  /** @type {HTMLElement} */ (document.querySelector('#mapModeSelector')).addEventListener('click', () => {
    const currentSelected = /** @type {HTMLInputElement} */ (document.querySelector('fieldset input:checked')).id;
    if (state.currentMapMode !== currentSelected) {
      state.currentMapMode = /** @type {State["currentMapMode"]} */ (currentSelected);
      updateMapMode(map, data, state);
    }
  });
}

/**
 * Swaps in the control bar for the current mode, selects its default filter and
 * redraws.
 * @param {LyricMap} map
 * @param {Data} data
 * @param {State} state
 */
export function updateMapMode(map, data, state) {
  let interfaceHtml;
  switch (state.currentMapMode) {
    case "placesMode":
      interfaceHtml = createPlacesInterfaceHtml(data);
      state.selectedId = "relationship_3";
      break;
    case "travelMode":
      interfaceHtml = createTravelInterfaceHtml(data);
      state.selectedId = "all_1";
      break;
    case "geoimaginaryMode":
      interfaceHtml = createGeoImaginaryInterfaceHtml(data);
      state.selectedId = "all_1";
      break;
    default:
      // Never returns, so interfaceHtml is known to be set below.
      assertUnreachable(state.currentMapMode, "unrecognized map mode");
  }

  /** @type {HTMLElement} */ (document.getElementById("poetsSelector")).innerHTML = interfaceHtml;
  /** @type {HTMLInputElement} */ (document.getElementById(state.selectedId)).checked = true;
  updateMap(map, data, state);
}
