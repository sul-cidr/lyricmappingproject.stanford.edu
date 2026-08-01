/**
 * @param {Data} data
 * @param {number} poetId
 * @returns {Poet}
 */
export function getPoet(data, poetId) {
  const poet = data.poetsById[poetId];
  if (!poet) console.log(`poetId ${poetId} does not exist in poetsById`);
  return poet;
}

/**
 * @param {Data} data
 * @param {number} poetId
 * @returns {Genre[]}
 */
export function getGenres(data, poetId) {
  if (data.genresByPoetId[poetId]) return data.genresByPoetId[poetId];
  else return [];
}

/**
 * @param {Data} data
 * @param {number} cityId
 * @returns {City}
 */
export function getCity(data, cityId) {
  const city = data.citiesById[cityId];
  if (!city) console.log(`cityId ${cityId} does not exist in citiesById`);
  return city;
}

/**
 * @param {Data} data
 * @param {number} cityId
 * @returns {CityPolitics[]}
 */
export function getGovs(data, cityId) {
  if (data.govsByCityId[cityId]) {
    return data.govsByCityId[cityId];
  }
  console.log(`cityId ${cityId} does not exist in govsByCityId`);
  return [];
}

/** The filters the places and geographical imaginary control bars offer. */
/** @type {PlacesFilterType[]} */
export const PLACES_FILTER_TYPES = ["all", "relationship", "poet", "genre"];

/** The filters the travel control bar offers. */
/** @type {TravelFilterType[]} */
export const TRAVEL_FILTER_TYPES = ["all", "poet", "destination", "smallregion", "region", "gov"];

/**
 * Splits state.selectedId (e.g. "poet_93") into its filter type and numeric id,
 * checking the type against the filters the given map actually offers.
 *
 * Validating here rather than trusting the string is what lets callers switch
 * exhaustively over four or six cases instead of eight, with no branch for a
 * filter their map cannot produce. selectedId always comes from a radio button
 * this code generated, so a mismatch means the interface builders and the map
 * modes have got out of step.
 * @template {MapFilterType} T
 * @param {State} state
 * @param {T[]} allowed
 * @param {string} mapName
 * @returns {[T, number]}
 */
function getFilter(state, allowed, mapName) {
  const [type, stringNum] = state.selectedId.split("_");
  const filterType = allowed.find(known => known === type);
  if (!filterType) {
    const message = `"${type}" is not a ${mapName} filter (selectedId "${state.selectedId}")`;
    alert(message);
    throw new Error(message);
  }
  return [filterType, parseInt(stringNum)];
}

/**
 * @param {State} state
 * @returns {[PlacesFilterType, number]}
 */
export function getPlacesFilter(state) {
  return getFilter(state, PLACES_FILTER_TYPES, "places");
}

/**
 * @param {State} state
 * @returns {[TravelFilterType, number]}
 */
export function getTravelFilter(state) {
  return getFilter(state, TRAVEL_FILTER_TYPES, "travel");
}
