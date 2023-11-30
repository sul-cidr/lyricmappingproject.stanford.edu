import { createInput, createInputFromTuple } from "./commonInterface.js";

export function createGeoImaginaryInterfaceHtml(data) {
  return (`
  <div class="buttonContainer">
    <fieldset class="controlForm">
      <div class="controlBarLabel">
      LOCATIONS IN POETRY: 
      </div>
      ${createInput("all_1", "ALL REFERENCES")}
    </fieldset>
  </div>

  <div class="buttonContainer">
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