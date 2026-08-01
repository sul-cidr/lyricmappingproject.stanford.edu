import { updateMap } from "../renderMap/updateMap.js";
import { createGeoImaginaryInterfaceHtml } from "./geoImaginaryInterface.js";
import { createPlacesInterfaceHtml } from "./placesInterface.js";
import { createTravelInterfaceHtml } from "./travelInterface.js";
import { mapStateFrom, selectedIdOf } from "../calcData/getters.js";
import { assertUnreachable } from "../assertUnreachable.js";

/**
 * The filter each map opens on, before anything is clicked.
 *
 * Typed a field per mode, so a default a control bar does not offer stops
 * compiling. Writing placesMode: { type: "all", num: 1 } here used to be
 * perfectly good JavaScript that alerted on first paint.
 * @type {DefaultFilters}
 */
export const DEFAULT_FILTERS = {
  placesMode: { type: "relationship", num: 3 },
  travelMode: { type: "all", num: 1 },
  geoimaginaryMode: { type: "all", num: 1 }
};

/**
 * The state a map starts in.
 * @param {MapMode} currentMapMode
 * @returns {MapState}
 */
export function defaultMapState(currentMapMode) {
  switch (currentMapMode) {
    case "placesMode":
      return { currentMapMode, filter: DEFAULT_FILTERS.placesMode };
    case "travelMode":
      return { currentMapMode, filter: DEFAULT_FILTERS.travelMode };
    case "geoimaginaryMode":
      return { currentMapMode, filter: DEFAULT_FILTERS.geoimaginaryMode };
    default:
      return assertUnreachable(currentMapMode, "unrecognized map mode");
  }
}

/**
 * Redraws the map whenever a different filter is picked in the control bar.
 * @param {LyricMap} map
 * @param {Data} data
 * @param {State} state
 */
export function addPoetsEventListener(map, data, state) {
  /** @type {HTMLElement} */ (document.querySelector("#poetsSelector")).addEventListener("click", () => {
    const selectedId = /** @type {HTMLInputElement} */ (document.querySelector("div.buttonContainer input:checked")).id;
    // Parsed against the mode currently showing, so the pair is checked as it
    // is built rather than every time it is read.
    const next = mapStateFrom(state.map.currentMapMode, selectedId);
    if (next.filter.type !== state.map.filter.type || next.filter.num !== state.map.filter.num) {
      state.map = next;
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
  /** @type {HTMLElement} */ (document.querySelector("#mapModeSelector")).addEventListener("click", () => {
    const currentSelected = /** @type {HTMLInputElement} */ (document.querySelector("fieldset input:checked")).id;
    if (state.map.currentMapMode !== currentSelected) {
      updateMapMode(map, data, state, /** @type {MapMode} */ (currentSelected));
    }
  });
}

/**
 * Swaps in the control bar for the given mode, selects its default filter and
 * redraws.
 *
 * The mode and the filter move together, in one assignment to state.map. They
 * used to be two fields set one after the other, so between those two lines the
 * state held the new mode alongside the previous map's filter.
 * @param {LyricMap} map
 * @param {Data} data
 * @param {State} state
 * @param {MapMode} currentMapMode
 */
export function updateMapMode(map, data, state, currentMapMode) {
  let interfaceHtml;
  switch (currentMapMode) {
    case "placesMode":
      interfaceHtml = createPlacesInterfaceHtml(data);
      break;
    case "travelMode":
      interfaceHtml = createTravelInterfaceHtml(data);
      break;
    case "geoimaginaryMode":
      interfaceHtml = createGeoImaginaryInterfaceHtml(data);
      break;
    default:
      // Never returns, so interfaceHtml is known to be set below.
      assertUnreachable(currentMapMode, "unrecognized map mode");
  }

  state.map = defaultMapState(currentMapMode);
  const selectedId = selectedIdOf(state.map.filter);

  /** @type {HTMLElement} */ (document.getElementById("poetsSelector")).innerHTML = interfaceHtml;
  /** @type {HTMLInputElement} */ (document.getElementById(selectedId)).checked = true;
  updateMap(map, data, state);
}
