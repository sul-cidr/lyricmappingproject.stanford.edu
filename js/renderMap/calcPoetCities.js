import { getGenres, getPlacesFilter, getGeoFilter } from "../calcData/getters.js";
import { assertUnreachable } from "../assertUnreachable.js";
import { getDateFilterFn } from "./calcCommon.js";

/** @typedef {PoetCity | GeoPoetCity} AnyPoetCity */

/**
 * Picks the right source rows for the current map, applies the date slider and
 * control-bar filters, and flattens the survivors for rendering.
 *
 * The two maps are handled apart rather than together, because they do not
 * offer the same filters: places has ORIGIN, ACTIVITY and the genres,
 * geographical imaginary has ALL REFERENCES. They share only "poet".
 * @param {Data} data
 * @param {State} state
 * @returns {RenderedPoetCity[]}
 */
export function calcPoetCities(data, state) {
  switch (state.currentMapMode) {
    case "placesMode":
      return calcPlacesPoetCities(data, state);
    case "geoimaginaryMode":
      return calcGeoPoetCities(data, state);
    case "travelMode":
      // The travel map draws arcs rather than bubbles, and calculates them in
      // lines.js. Nothing routes it here.
      throw new Error("calcPoetCities is not used by the travel map");
    default:
      return assertUnreachable(state.currentMapMode, "unrecognized current map mode");
  }
}

/**
 * @param {Data} data
 * @param {State} state
 * @returns {RenderedPoetCity[]}
 */
function calcPlacesPoetCities(data, state) {
  const [type, num] = getPlacesFilter(state);
  const dated = data.poetCities.filter(getDateFilterFn(data, state));

  if (type === "genre") return renderGenreRows(dated, data, num);

  return dated.filter(getPlacesFilterFn(type, num)).map(poetCity => renderPoetCity(poetCity));
}

/**
 * @param {Data} data
 * @param {State} state
 * @returns {RenderedPoetCity[]}
 */
function calcGeoPoetCities(data, state) {
  const [type, num] = getGeoFilter(state);
  const dated = data.geopoetCities.filter(getDateFilterFn(data, state));

  return dated.filter(getGeoFilterFn(type, num)).map(poetCity => renderPoetCity(poetCity));
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
    poetDetailName: poetCity.poetDetailName,
    poetDates: poetCity.poetDates,
    poetGenres: poetCity.poetGenres,
    poetSources: poetCity.poetSources,
    relationshipId: poetCity.relationshipId,
    reference: reference
  };
}
