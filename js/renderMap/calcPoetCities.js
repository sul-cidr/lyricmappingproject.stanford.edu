import { getGenres, getPlacesFilter } from "../calcData/getters.js";
import { assertUnreachable } from "../assertUnreachable.js";
import { getDateFilterFn } from "./calcCommon.js";

/** @typedef {PoetCity | GeoPoetCity} AnyPoetCity */
/** @typedef {(poetCity: AnyPoetCity) => boolean} PoetCityFilter */

/**
 * Picks the right source rows for the current map, applies the date slider and
 * control-bar filters, and flattens the survivors for rendering.
 * @param {Data} data
 * @param {State} state
 * @returns {RenderedPoetCity[]}
 */
export function calcPoetCities(data, state) {
  const [type, num] = getPlacesFilter(state);
  const dated = getPoetCitiesData(data, state).filter(getDateFilterFn(data, state));

  if (type === "genre") return renderGenreRows(dated, data, num);

  return dated.filter(getFilterFn(type, num)).map(poetCity => renderPoetCity(poetCity));
}

/**
 * Filters and renders together, so the entry that qualifies a row is the one
 * that supplies its citation.
 * @param {AnyPoetCity[]} poetCities
 * @param {Data} data
 * @param {number} genreId
 * @returns {RenderedPoetCity[]}
 */
function renderGenreRows(poetCities, data, genreId) {
  return poetCities.flatMap(poetCity => {
    if (poetCity.relationshipId !== 1) return [];
    const genre = getGenres(data, poetCity.poetId).find(candidate => candidate.genreId === genreId);
    return genre ? [renderPoetCity(poetCity, genre)] : [];
  });
}

/**
 * @param {Data} data
 * @param {State} state
 * @returns {AnyPoetCity[]}
 */
function getPoetCitiesData(data, state) {
  switch (state.currentMapMode) {
    case "placesMode":
    case "travelMode":
      return [...data.poetCities];
    case "geoimaginaryMode":
      return [...data.geopoetCities];
    default:
      return assertUnreachable(state.currentMapMode, "unrecognized current map mode");
  }
}

/**
 * Builds the predicate for the selected radio button. Genre is excluded from
 * the type because renderGenreRows handles it.
 * @param {Exclude<PlacesFilterType, "genre">} type
 * @param {number} num
 * @returns {PoetCityFilter}
 */
function getFilterFn(type, num) {
  switch (type) {
    case "all":
      return () => true;
    case "relationship":
      // Relationship 3 is "activity", which every row qualifies for.
      if (num === 3) return () => true;
      return poetCity => poetCity.relationshipId === num;
    case "poet":
      return poetCity => poetCity.poetId === num;
    default:
      return assertUnreachable(type, "unrecognized filter when calculating poet cities");
  }
}

/**
 * Flattens one row for rendering, collapsing the citation columns into a
 * single reference.
 * @param {AnyPoetCity} poetCity
 * @param {Genre} [genre] supplies the citation instead, in genre mode
 * @returns {RenderedPoetCity}
 */
function renderPoetCity(poetCity, genre) {
  const source = genre ?? poetCity;
  /** @type {Reference} */
  const reference = {
    source_citation: source.source_citation,
    source_greektext: source.source_greektext,
    source_translation: source.source_translation,
    source_translator: source.source_translator
  };
  // Only geographical-imaginary rows carry a source_poem column.
  if ("source_poem" in poetCity && poetCity.source_poem) reference.source_poem = poetCity.source_poem;

  return {
    poetId: poetCity.poetId,
    cityId: poetCity.cityId,
    cityname: poetCity.cityname,
    poetname: poetCity.poetname,
    poetDetailName: poetCity.poetDetailName,
    poetDates: poetCity.poetDates,
    poetGenres: poetCity.poetGenres,
    poetSources: poetCity.poetSources,
    relationshipId: poetCity.relationshipId,
    reference: reference
  };
}
