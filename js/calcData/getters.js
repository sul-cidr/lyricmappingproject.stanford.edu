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

/**
 * Splits state.selectedId (e.g. "poet_93") into its filter type and numeric id.
 * @param {State} state
 * @returns {[string, number]}
 */
export function getMapTypeNum(state) {
  const [type, stringNum] = state.selectedId.split("_");
  const num = parseInt(stringNum);
  return [type, num];
}
