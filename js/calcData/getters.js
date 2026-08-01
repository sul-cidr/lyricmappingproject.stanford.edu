import { assertUnreachable } from "../assertUnreachable.js";

/**
 * @param {Lookups} lookups
 * @param {number} poetId
 * @returns {Poet}
 */
export function getPoet(lookups, poetId) {
  const poet = lookups.poetsById[poetId];
  if (!poet) console.log(`poetId ${poetId} does not exist in poetsById`);
  return poet;
}

/**
 * @param {Lookups} lookups
 * @param {number} poetId
 * @returns {Genre[]}
 */
export function getGenres(lookups, poetId) {
  if (lookups.genresByPoetId[poetId]) return lookups.genresByPoetId[poetId];
  else return [];
}

/**
 * @param {Lookups} lookups
 * @param {number} cityId
 * @returns {City}
 */
export function getCity(lookups, cityId) {
  const city = lookups.citiesById[cityId];
  if (!city) console.log(`cityId ${cityId} does not exist in citiesById`);
  return city;
}

/**
 * @param {Lookups} lookups
 * @param {number} cityId
 * @returns {CityPolitics[]}
 */
export function getGovs(lookups, cityId) {
  if (lookups.govsByCityId[cityId]) {
    return lookups.govsByCityId[cityId];
  }
  console.log(`cityId ${cityId} does not exist in govsByCityId`);
  return [];
}

/** The filters the places control bar offers. */
/** @type {PlacesFilterType[]} */
export const PLACES_FILTER_TYPES = ["relationship", "poet", "genre"];

/** The filters the geographical imaginary control bar offers. */
/** @type {GeoFilterType[]} */
export const GEO_FILTER_TYPES = ["all", "poet"];

/** The filters the travel control bar offers. */
/** @type {TravelFilterType[]} */
export const TRAVEL_FILTER_TYPES = ["all", "poet", "destination", "smallregion", "region", "gov"];

/**
 * Pairs a map mode with the filter its control bar has selected, parsing the
 * radio button's id (e.g. "poet_93") into its kind and number.
 *
 * The single place a MapState is constructed, and the only place a selectedId
 * string becomes a filter. Because it is exhaustive over the three modes and
 * checks each id against that mode's own filters, a mode paired with a filter
 * it does not offer cannot leave here — which is what lets every consumer
 * downstream narrow with a switch and handle nothing impossible.
 *
 * selectedId always comes from a radio button this code generated, so a
 * mismatch means the interface builders and the map modes have got out of step.
 * @param {MapMode} currentMapMode
 * @param {string} selectedId
 * @returns {MapState}
 */
export function mapStateFrom(currentMapMode, selectedId) {
  switch (currentMapMode) {
    case "placesMode":
      return { currentMapMode, filter: parseFilter(selectedId, PLACES_FILTER_TYPES, "places") };
    case "geoimaginaryMode":
      return { currentMapMode, filter: parseFilter(selectedId, GEO_FILTER_TYPES, "geographical imaginary") };
    case "travelMode":
      return { currentMapMode, filter: parseFilter(selectedId, TRAVEL_FILTER_TYPES, "travel") };
    default:
      return assertUnreachable(currentMapMode, "unrecognized map mode");
  }
}

/**
 * The id a filter was built from, and will be found under in the control bar.
 * The inverse of parseFilter().
 * @param {PlacesFilter | GeoFilter | TravelFilter} filter
 * @returns {string}
 */
export function selectedIdOf(filter) {
  return `${filter.type}_${filter.num}`;
}

/**
 * @template {MapFilterType} T
 * @param {string} selectedId
 * @param {T[]} allowed
 * @param {string} mapName
 * @returns {{ type: T, num: number }}
 */
function parseFilter(selectedId, allowed, mapName) {
  const [type, stringNum] = selectedId.split("_");
  const filterType = allowed.find(known => known === type);
  if (!filterType) {
    const message = `"${type}" is not a ${mapName} filter (selectedId "${selectedId}")`;
    alert(message);
    throw new Error(message);
  }
  return { type: filterType, num: parseInt(stringNum) };
}
