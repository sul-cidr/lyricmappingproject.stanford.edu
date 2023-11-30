import { updateMap } from "../renderMap/updateMap.js";
import { createGeoImaginaryInterfaceHtml } from "./geoImaginaryInterface.js";
import { createPlacesInterfaceHtml } from "./placesInterface.js";
import { createTravelInterfaceHtml } from "./travelInterface.js";

export function addPoetsEventListener(map, data, state) {
  document.querySelector('#poetsSelector').addEventListener('click', () => {
    const currentSelected = document.querySelector('div.buttonContainer input:checked').id;
    if (state.selectedId != currentSelected) {
      state.selectedId = currentSelected;
      updateMap(map, data, state);
    }
  });
}

export function addMapModeEventListener(map, data, state) {
  document.querySelector('#mapModeSelector').addEventListener('click', () => {
    const currentSelected = document.querySelector('fieldset input:checked').id;
    if (state.currentMapMode != currentSelected) {
      state.currentMapMode = currentSelected;
      updateMapMode(map, data, state);
    }
  });
}

export function updateMapMode(map, data, state) {
  let interfaceHtml;
  if (state.currentMapMode === "places_mode") {
    interfaceHtml = createPlacesInterfaceHtml(data);
    state.selectedId = "relationship_3";
  } else if (state.currentMapMode === "travel_mode") {
    interfaceHtml = createTravelInterfaceHtml(data);
    state.selectedId = "all_1";
  } else if (state.currentMapMode === "geo_imaginary_mode") {
    interfaceHtml = createGeoImaginaryInterfaceHtml(data);
    state.selectedId = "all_1";
  } else {
    alert("unrecognized map mode");
  }

  document.getElementById("poetsSelector").innerHTML = interfaceHtml;
  document.getElementById(state.selectedId).checked = true;
  updateMap(map, data, state);
}