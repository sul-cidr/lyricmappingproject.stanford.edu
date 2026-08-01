import { createFilterInput, createInputFromTuple } from "./commonInterface.js";

/**
 * The control bar for the places map: origin/activity, poets with no known
 * travel, and genres.
 * @param {Data} data
 * @returns {string}
 */
export function createPlacesInterfaceHtml(data) {
  return (`
    <div class="buttonContainer" tabindex="0">
      <fieldset class="controlForm">
        <div class="controlBarLabel">
          PLACE OF:
        </div>
        ${createFilterInput("relationship", 1, "ORIGIN")}
        ${createFilterInput("relationship", 3, "ACTIVITY")}
      </fieldset>
    </div>

    <div class="buttonContainer" style="height: 100px;" tabindex="0">
      <fieldset class="controlForm">
        <div class="controlBarLabel">
          POETS WITH UNKNOWN TRAVELS:
        </div>
        ${data.poetsWithUnknownTravel
      .map(poetIdWithName => createInputFromTuple(poetIdWithName, "poet"))
      .join("")
    }
      </fieldset>
    </div>

    <div class="buttonContainer" tabindex="0">
      <fieldset class="controlForm">
        <div class="controlBarLabel">
          GENRE:
        </div>
        ${data.genreIdsWithName
      .map(genreIdWithName => createInputFromTuple(genreIdWithName, "genre"))
      .join("")
    }
      </fieldset>
    </div>
  `);
}