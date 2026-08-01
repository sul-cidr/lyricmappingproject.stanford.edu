import { createFilterInput, createInputFromTuple } from "./commonInterface.js";

/**
 * The control bar for the geographical-imaginary map.
 * @param {Data} data
 * @returns {string}
 */
export function createGeoImaginaryInterfaceHtml(data) {
  return (`
  <div class="buttonContainer" tabindex="0">
    <fieldset class="controlForm">
      <div class="controlBarLabel">
      LOCATIONS IN POETRY: 
      </div>
      ${createFilterInput("all", 1, "ALL REFERENCES")}
    </fieldset>
  </div>

  <div class="buttonContainer" tabindex="0">
    <fieldset class="controlForm">
      <div class="controlBarLabel">
        POETIC WORLD OF: 
      </div>
      ${data.geoImaginaryPoets
      .map(poetIdWithName => createInputFromTuple(poetIdWithName, "poet"))
      .join("")
    }
    </fieldset>
  </div>
  `);
}