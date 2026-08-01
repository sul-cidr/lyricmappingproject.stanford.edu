import { TRAVEL_RED, TRAVEL_PURPLE, TRAVEL_YELLOW } from "../constants/colors.js";
import { drawLines } from "../drawMap/drawLines.js";
import { drawBubblesAndLegends } from "../drawMap/drawBubbles.js";
import { getMapTypeNum } from "../calcData/getters.js";
import { createTravelPopupHtml, createGovTravelPopupHtml } from "../popups/travelPopups.js";
import { getDateFilterFn } from "./calcCommon.js";

/**
 * @param {LyricMap} map
 * @param {Data} data
 * @param {State} state
 */
export function calculateAndDrawLines(map, data, state) {
  const filteredPoetLines =
    filterLines(state, data)
      .filter(getDateFilterFn(data, state));
  const calculatedLines = calculateLines(state, data, filteredPoetLines);
  const travelBubbles = calculateTravelBubbles(data, filteredPoetLines);
  drawLines(map, calculatedLines);
  drawBubblesAndLegends(map, travelBubbles);
}

/**
 * Narrows every poet line down to those matching the selected radio button.
 * @param {State} state
 * @param {Data} data
 * @returns {Line[]}
 */
function filterLines(state, data) {
  const [type, num] = getMapTypeNum(state);
  if (type === "all") {
    return data.lines;
  } else if (type === "poet") {
    return data.lines.filter(line => line.poetId === num);
  } else if (type === "destination") {
    return data.lines.filter(line =>
      line.bornCityId === num || line.activeCityId === num
    );
  } else if (type === "smallregion") {
    return data.lines.filter(line =>
      line.bornCity.regionId === num || line.activeCity.regionId === num
    );
  } else if (type === "region") {
    return data.lines.filter(line =>
      line.bornCity.bigRegionId === num || line.activeCity.bigRegionId === num
    );
  } else if (type === "gov") {
    return data.lines.filter(line =>
      line.bornGovIds.includes(num) || line.activeGovIds.includes(num)
    );
  }
  else {
    alert(`unrecognized type of map in travel map: <b>${type}</b>`);
    // Cast: unreachable for a valid State; alerting then failing on the
    // following .filter() is the long-standing behaviour.
    return /** @type {Line[]} */ (/** @type {unknown} */ (undefined));
  }
}

/**
 * @param {number} from
 * @param {number} to
 * @returns {number}
 */
function hashCityIds(from, to) {
  return from * 1000 + to;
}

/**
 * Merges every poet line sharing a city pair into a single drawn arc, then
 * colours, weights and builds a popup for each.
 * @param {State} state
 * @param {Data} data
 * @param {Line[]} filteredPoetLines
 * @returns {Record<number, DrawnLine>}
 */
function calculateLines(state, data, filteredPoetLines) {
  const [type, num] = getMapTypeNum(state);

  /** @type {Record<number, DrawnLine>} */
  const lines = {}
  for (const line of filteredPoetLines) {
    const hash = hashCityIds(line.bornCityId, line.activeCityId);
    if (!lines[hash]) {
      lines[hash] = /** @type {DrawnLine} */ ({});
      lines[hash].fromCity = line.bornCity;
      lines[hash].toCity = line.activeCity;
      lines[hash].poetLines = [];
      lines[hash].dotted = false;
      lines[hash].color = TRAVEL_RED;
      lines[hash].name = (`${line.bornCity.infowindowName} -> ${line.activeCity.infowindowName}`).toUpperCase();
    }
    lines[hash].poetLines.push(line);
    colorLine(state, data, lines[hash]);
    if (line.dotted) lines[hash].dotted = true;
  }
  for (const hash in lines) {
    const line = lines[hash];
    weightLine(state, line);
    if (type === "gov") {
      line.popupHtml = createGovTravelPopupHtml(data, line);
    } else {
      line.popupHtml = createTravelPopupHtml(data, line);
    }
  }
  return lines;
}

/**
 * Thickens an arc in proportion to how many poets travelled it.
 * @param {State} state
 * @param {DrawnLine} line mutated in place
 */
function weightLine(state, line) {
  const [type, num] = getMapTypeNum(state);
  const poetsNum = line.poetLines.length;
  let multiplier = 1;
  let increment = 0;
  if (type === "destination" || type === "smallregion" || type === "poet") {
    multiplier = 2;
    increment = 1;
  }
  line.weight = multiplier * poetsNum + increment;
}

/**
 * Recolours an arc when it leaves (purple) or stays within (yellow) whatever is
 * currently selected. Default is red.
 * @param {State} state
 * @param {Data} data
 * @param {DrawnLine} line mutated in place
 */
function colorLine(state, data, line) {
  const [type, num] = getMapTypeNum(state);
  // default color is red
  if (type === "destination") {
    if (line.fromCity.cityId === num) line.color = TRAVEL_PURPLE;
  } else if (type === "smallregion") {
    if (line.fromCity.regionId === num) line.color = TRAVEL_PURPLE;
  } else if (type === "region") {
    if (line.fromCity.bigRegionId === num) line.color = TRAVEL_PURPLE;
  } else if (type === "gov") {
    const bornGovIds = line.poetLines.flatMap(pl => pl.bornGovIds).filter(govId => govId === num);
    const activeGovIds = line.poetLines.flatMap(pl => pl.activeGovIds).filter(govId => govId === num);
    if (bornGovIds.length && activeGovIds.length) line.color = TRAVEL_YELLOW;
    else if (bornGovIds.length) line.color = TRAVEL_PURPLE;
  }
}

/**
 * One plain bubble for every city touched by a visible line.
 * @param {Data} data
 * @param {Line[]} filteredPoetLines
 * @returns {Record<number, DrawableBubble>}
 */
function calculateTravelBubbles(data, filteredPoetLines) {
  /** @type {Set<number>} */
  const cityIds = new Set()
  for (const plId in filteredPoetLines) {
    const pl = filteredPoetLines[plId];
    cityIds.add(pl.bornCityId);
    cityIds.add(pl.activeCityId);
  }

  /** @type {Record<number, DrawableBubble>} */
  const bubbles = {};
  for (const cityId of cityIds) {
    const city = data.citiesById[cityId];
    bubbles[cityId] = /** @type {DrawableBubble} */ ({});
    bubbles[cityId].city = city;
    bubbles[cityId].price = 10;
  }

  return bubbles;
}
