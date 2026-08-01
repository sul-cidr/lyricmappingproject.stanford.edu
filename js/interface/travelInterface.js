import { createFilterInput, createInputFromOption } from "./commonInterface.js";
import { TRAVEL_RED, TRAVEL_PURPLE, TRAVEL_YELLOW } from "../constants/colors.js";

/** The regimes offered by the political system filter, in display order. */
/** @type {FilterOption[]} */
const GOVERNMENTS = [
  { id: 3, name: "Democracy" },
  { id: 4, name: "Kingship" },
  { id: 7, name: "Mixed" },
  { id: 1, name: "Oligarchy" },
  { id: 2, name: "Tyranny" }
];

/**
 * The control bar for the travel map: poet, city, region, small region and
 * political system.
 * @param {Data} data
 * @returns {string}
 */
export function createTravelInterfaceHtml(data) {
  return (`
  <div class="buttonContainer tabindex="0"">
    <fieldset class="controlForm">
      <div class="controlBarLabel">
        MOBILITY
      </div>
      ${createFilterInput("all", 1, "ALL CASES")}
    </fieldset>
  </div>

  <div class="buttonContainer" style="height: 100px;" tabindex="0">
    <fieldset class="controlForm">
      <div class="controlBarLabel">
        POET: 
      </div>
      ${data.travelPoets
      .map(poet => createInputFromOption(poet, "poet"))
      .join("")
    }
    </fieldset>
  </div>

  <div class="buttonContainer" style="height: 100px;" tabindex="0">
  <fieldset class="controlForm">
    <div class="controlBarLabel">
      PLACES 
      (<span style="color:${TRAVEL_RED};">to</span>/<span style="color:${TRAVEL_PURPLE};">from</span>):
    </div>
    ${data.travelCities
      .map(city => createInputFromOption(city, "destination"))
      .join("")
    }
  </fieldset>
</div>

<div class="buttonContainer" tabindex="0">
  <fieldset class="controlForm">
    <div class="controlBarLabel">
      GEOGRAPHICAL REGION 
      (<span style="color:${TRAVEL_RED};">to</span>/<span style="color:${TRAVEL_PURPLE};">from</span>):
    </div>
    ${data.bigRegions
      .map(region => createInputFromOption({ id: region.regionId, name: region.regionname }, "region"))
      .join("")
    }
  </fieldset>
</div>

<div class="buttonContainer" style="height: 100px;" tabindex="0">
  <fieldset class="controlForm">
    <div class="controlBarLabel">
      SMALL GEOGRAPHICAL REGION 
      (<span style="color:${TRAVEL_RED};">to</span>/<span style="color:${TRAVEL_PURPLE};">from</span>):
    </div>
    ${data.regionsForInterface
      .map(region => createInputFromOption(region, "smallregion"))
      .join("")
    }
  </fieldset>
</div>

<div class="buttonContainer" height: 100px;" tabindex="0">
  <fieldset class="controlForm">
    <div class="controlBarLabel">
      POLITICAL SYSTEM 
      (<span style="color:${TRAVEL_RED};">to</span>/<span style="color:${TRAVEL_PURPLE};">from</span>/<span style="color:${TRAVEL_YELLOW};">within</span>):
    </div>
    ${GOVERNMENTS.map(government => createInputFromOption(government, "gov")).join("")}
    <div class="picker-label" style="cursor: auto">[Mapping in Progress]</label>		
  </fieldset>
</div>
</div>
  `);
}