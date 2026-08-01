import { TRAVEL_RED, TRAVEL_PURPLE, TRAVEL_YELLOW } from "../constants/colors.js";
import { drawLines } from "../drawMap/drawLines.js";
import { drawBubblesAndLegends } from "../drawMap/drawBubbles.js";
import { getTravelFilter } from "../calcData/getters.js";
import { createTravelPopupHtml, createGovTravelPopupHtml } from "../popups/travelPopups.js";
import { getDateFilterFn } from "./calcCommon.js";
import { assertUnreachable } from "../assertUnreachable.js";

/**
 * @param {LyricMap} map
 * @param {Data} data
 * @param {State} state
 */
export function calculateAndDrawLines(map, data, state) {
  // Parsed once here and threaded down. Re-deriving it inside colorLine and
  // weightLine meant splitting state.selectedId a few hundred times per redraw.
  const [type, num] = getTravelFilter(state);
  const filteredPoetLines = filterLines(data, type, num).filter(getDateFilterFn(data, state));
  const calculatedLines = calculateLines(data, type, num, filteredPoetLines);
  const travelBubbles = calculateTravelBubbles(data, filteredPoetLines);
  drawLines(map, calculatedLines);
  drawBubblesAndLegends(map, travelBubbles);
}

/**
 * Narrows every poet line down to those matching the selected radio button.
 * @param {Data} data
 * @param {TravelFilterType} type
 * @param {number} num
 * @returns {Line[]}
 */
export function filterLines(data, type, num) {
  switch (type) {
    case "all":
      return data.lines;
    case "poet":
      return data.lines.filter(line => line.poetId === num);
    case "destination":
      return data.lines.filter(line => line.bornCityId === num || line.activeCityId === num);
    case "smallregion":
      return data.lines.filter(line => line.bornCity.regionId === num || line.activeCity.regionId === num);
    case "region":
      return data.lines.filter(line => line.bornCity.bigRegionId === num || line.activeCity.bigRegionId === num);
    case "gov":
      return data.lines.filter(line => line.bornGovIds.includes(num) || line.activeGovIds.includes(num));
    default:
      // Exhaustive over TravelFilterType: add a member without handling it above
      // and this stops compiling.
      return assertUnreachable(type, "unrecognized filter in the travel map");
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
 * @param {Data} data
 * @param {TravelFilterType} type
 * @param {number} num
 * @param {Line[]} filteredPoetLines
 * @returns {Record<number, DrawnLine>}
 */
export function calculateLines(data, type, num, filteredPoetLines) {
  /** @type {Record<number, DrawnLine>} */
  const lines = {};

  for (const [key, poetLines] of Object.entries(groupLinesByCityPair(filteredPoetLines))) {
    const { bornCity: fromCity, activeCity: toCity } = poetLines[0];
    // The arc is assembled first because the popup is rendered from it, and from
    // nothing that is added alongside it. That ordering is what lets an arc be
    // built complete instead of filled in field by field.
    /** @type {TravelArc} */
    const arc = {
      fromCity,
      toCity,
      poetLines,
      dotted: poetLines.some(line => line.dotted),
      color: arcColor(type, num, fromCity, poetLines),
      name: `${fromCity.infowindowName} -> ${toCity.infowindowName}`.toUpperCase(),
      weight: arcWeight(type, poetLines.length)
    };

    lines[Number(key)] = {
      ...arc,
      popupHtml: type === "gov" ? createGovTravelPopupHtml(data, arc) : createTravelPopupHtml(data, arc)
    };
  }

  return lines;
}

/**
 * Buckets poet lines by the city pair they run between, which is what an arc
 * merges.
 * @param {Line[]} filteredPoetLines
 * @returns {Record<number, Line[]>}
 */
function groupLinesByCityPair(filteredPoetLines) {
  /** @type {Record<number, Line[]>} */
  const linesByCityPair = {};
  for (const line of filteredPoetLines) {
    const hash = hashCityIds(line.bornCityId, line.activeCityId);
    if (!linesByCityPair[hash]) linesByCityPair[hash] = [];
    linesByCityPair[hash].push(line);
  }
  return linesByCityPair;
}

/**
 * Thickens an arc in proportion to how many poets travelled it, and doubles it
 * for the filters that leave only a handful of arcs on the map, where a weight
 * of 1 would be all but invisible.
 *
 * Exhaustive rather than defaulting to the thin case, so a seventh travel filter
 * has to say which of the two it is instead of quietly getting the thin one.
 * @param {TravelFilterType} type
 * @param {number} poetsNum
 * @returns {number}
 */
function arcWeight(type, poetsNum) {
  switch (type) {
    case "poet":
    case "destination":
    case "smallregion":
      return 2 * poetsNum + 1;
    case "all":
    case "region":
    case "gov":
      return poetsNum;
    default:
      return assertUnreachable(type, "unrecognized filter when weighting a travel arc");
  }
}

/**
 * Purple when an arc leaves whatever is currently selected, yellow when it both
 * leaves and arrives within it, red otherwise.
 *
 * As filterLines above, exhaustive over TravelFilterType. Red was previously the
 * fallthrough at the end of an if-chain, which meant ALL and POET got it by
 * saying nothing — and so would any filter added later, silently.
 * @param {TravelFilterType} type
 * @param {number} num
 * @param {City} fromCity
 * @param {Line[]} poetLines
 * @returns {string}
 */
function arcColor(type, num, fromCity, poetLines) {
  switch (type) {
    case "all":
    case "poet":
      // Neither picks out a place, so there is no leaving or arriving to show.
      return TRAVEL_RED;
    case "destination":
      return fromCity.cityId === num ? TRAVEL_PURPLE : TRAVEL_RED;
    case "smallregion":
      return fromCity.regionId === num ? TRAVEL_PURPLE : TRAVEL_RED;
    case "region":
      return fromCity.bigRegionId === num ? TRAVEL_PURPLE : TRAVEL_RED;
    case "gov": {
      // Read across the whole arc, not one line: several poets can share a
      // journey, and any of them born under the selected regime colours it.
      const bornUnder = poetLines.some(line => line.bornGovIds.includes(num));
      const activeUnder = poetLines.some(line => line.activeGovIds.includes(num));
      if (bornUnder && activeUnder) return TRAVEL_YELLOW;
      return bornUnder ? TRAVEL_PURPLE : TRAVEL_RED;
    }
    default:
      return assertUnreachable(type, "unrecognized filter when colouring a travel arc");
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
  const cityIds = new Set();
  for (const line of filteredPoetLines) {
    cityIds.add(line.bornCityId);
    cityIds.add(line.activeCityId);
  }

  /** @type {Record<number, DrawableBubble>} */
  const bubbles = {};
  for (const cityId of cityIds) {
    bubbles[cityId] = { city: data.citiesById[cityId], price: 10 };
  }

  return bubbles;
}
