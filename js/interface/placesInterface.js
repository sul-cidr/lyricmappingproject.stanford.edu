import { createInput, createInputFromTuple } from "./commonInterface.js";

export function createPlacesInterfaceHtml(data) {
  return (`
    <div class="buttonContainer" tabindex="0">
      <fieldset class="controlForm">
        <div class="controlBarLabel">
          PLACE OF:
        </div>
        ${createInput("relationship_1", "ORIGIN")}
        ${createInput("relationship_3", "ACTIVITY")}
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