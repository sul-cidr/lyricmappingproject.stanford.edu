import { createInput, createInputFromTuple } from "./commonInterface.js";
import { TRAVEL_RED, TRAVEL_PURPLE, TRAVEL_YELLOW } from "../constants/colors.js";

export function createTravelInterfaceHtml(data) {
  return (`
  <div class="buttonContainer">
    <fieldset class="controlForm">
      <div class="controlBarLabel">
        MOBILITY
      </div>
      ${createInput("all_1", "ALL CASES")}
    </fieldset>
  </div>

  <div class="buttonContainer" style="height: 100px;">
    <fieldset class="controlForm">
      <div class="controlBarLabel">
        POET: 
      </div>
      ${data.travelPoets
      .map(poetIdWithName => createInputFromTuple(poetIdWithName, "poet"))
      .join("")
    }
    </fieldset>
  </div>

  <div class="buttonContainer" style="height: 100px;">
  <fieldset class="controlForm">
    <div class="controlBarLabel">
      PLACES 
      (<span style="color:${TRAVEL_RED};">to</span>/<span style="color:${TRAVEL_PURPLE};">from</span>):
    </div>
    ${data.travelCities
      .map(cityIdWithName => createInputFromTuple(cityIdWithName, "destination"))
      .join("")
    }
  </fieldset>
</div>

<div class="buttonContainer">
  <fieldset class="controlForm">
    <div class="controlBarLabel">
      GEOGRAPHICAL REGION 
      (<span style="color:${TRAVEL_RED};">to</span>/<span style="color:${TRAVEL_PURPLE};">from</span>):
    </div>
    ${data.bigRegions
      .map(region => createInputFromTuple([region.regionId, region.regionname], "region"))
      .join("")
    }
  </fieldset>
</div>

<div class="buttonContainer" style="height: 100px;">
  <fieldset class="controlForm">
    <div class="controlBarLabel">
      SMALL GEOGRAPHICAL REGION 
      (<span style="color:${TRAVEL_RED};">to</span>/<span style="color:${TRAVEL_PURPLE};">from</span>):
    </div>
    ${data.regionsForInterface
      .map(regionTuple => createInputFromTuple(regionTuple, "smallregion"))
      .join("")
    }
  </fieldset>
</div>

<div class="buttonContainer" height: 100px;">
  <fieldset class="controlForm">
    <div class="controlBarLabel">
      POLITICAL SYSTEM 
      (<span style="color:${TRAVEL_RED};">to</span>/<span style="color:${TRAVEL_PURPLE};">from</span>/<span style="color:${TRAVEL_YELLOW};">within</span>):
    </div>
    ${[
      [3, "Democracy"],
      [4, "Kingship"],
      [7, "Mixed"],
      [1, "Oligarchy"],
      [2, "Tyranny"]
    ].map(tuple => createInputFromTuple(tuple, "gov")).join("")}
    <div class="picker-label" style="cursor: auto">[Mapping in Progress]</label>		
  </fieldset>
</div>
</div>
  `);
}