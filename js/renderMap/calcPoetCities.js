import { getGenres } from "../calcData/getters.js";
import { assertUnreachable } from "../assertUnreachable.js";
import { getDateFilterFn } from "./calcCommon.js";

/** @typedef {PoetCity | GeoPoetCity} AnyPoetCity */

/**
 * Applies the date slider and the selected places filter, and flattens the
 * survivors for rendering.
 *
 * Exported alongside calcGeoPoetCities() rather than behind one function that
 * switched on the map mode. That switch needed a third branch for the travel
 * map, which draws arcs rather than bubbles and never called it, so the branch
 * could only throw.
 * @param {Data} data
 * @param {State} state
 * @param {PlacesFilter} filter
 * @returns {RenderedPoetCity[]}
 */
export function calcPlacesPoetCities(data, state, filter) {
  const { type, num } = filter;
  const dated = data.poetCities.filter(getDateFilterFn(data, state));

  if (type === "genre") return renderGenreRows(dated, data, num);

  return dated.filter(getPlacesFilterFn(type, num)).map(poetCity => renderPoetCity(poetCity));
}

/**
 * As calcPlacesPoetCities, for the geographical imaginary map's rows.
 * @param {Data} data
 * @param {State} state
 * @param {GeoFilter} filter
 * @returns {RenderedPoetCity[]}
 */
export function calcGeoPoetCities(data, state, filter) {
  const dated = data.geopoetCities.filter(getDateFilterFn(data, state));

  return dated.filter(getGeoFilterFn(filter.type, filter.num)).map(poetCity => renderPoetCity(poetCity));
}

/**
 * Filters and renders together, so the entry that qualifies a row is the one
 * that supplies its citation.
 * @param {PoetCity[]} poetCities
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
 * Builds the predicate for the selected places radio button. Genre is excluded
 * from the type because renderGenreRows handles it.
 * @param {Exclude<PlacesFilterType, "genre">} type
 * @param {number} num
 * @returns {(poetCity: PoetCity) => boolean}
 */
function getPlacesFilterFn(type, num) {
  switch (type) {
    case "relationship":
      // Relationship 3 is "activity", which every row qualifies for.
      if (num === 3) return () => true;
      return poetCity => poetCity.relationshipId === num;
    case "poet":
      return poetCity => poetCity.poetId === num;
    default:
      return assertUnreachable(type, "unrecognized filter on the places map");
  }
}

/**
 * As getPlacesFilterFn, for the geographical imaginary map's two filters.
 * @param {GeoFilterType} type
 * @param {number} num
 * @returns {(poetCity: GeoPoetCity) => boolean}
 */
function getGeoFilterFn(type, num) {
  switch (type) {
    case "all":
      return () => true;
    case "poet":
      return poetCity => poetCity.poetId === num;
    default:
      return assertUnreachable(type, "unrecognized filter on the geographical imaginary map");
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
    relationshipId: poetCity.relationshipId,
    reference: reference
  };
}
