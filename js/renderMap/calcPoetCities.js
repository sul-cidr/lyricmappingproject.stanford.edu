import { getPlacesFilter } from "../calcData/getters.js";
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
  const poetCitiesData = getPoetCitiesData(data, state);
  const filteredPoetCities = poetCitiesData.filter(getDateFilterFn(data, state)).filter(getFilterFn(data, state));

  const renderedPoetCities = renderPoetCities(filteredPoetCities, data, state);

  return renderedPoetCities;
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
 * Builds the predicate for whichever radio button is currently selected.
 * @param {Data} data
 * @param {State} state
 * @returns {PoetCityFilter}
 */
function getFilterFn(data, state) {
  const [type, num] = getPlacesFilter(state);
  switch (type) {
    case "all":
      return () => true;
    case "relationship":
      // Relationship 3 is "activity", which every row qualifies for.
      if (num === 3) return () => true;
      return poetCity => poetCity.relationshipId === num;
    case "poet":
      return poetCity => poetCity.poetId === num;
    case "genre":
      return poetCity =>
        !!data.genresByPoetId[poetCity.poetId] &&
        data.genresByPoetId[poetCity.poetId].map(genre => genre.genreId).includes(num) &&
        poetCity.relationshipId === 1;
    default:
      // Exhaustive over PlacesFilterType: add a member without handling it above
      // and this stops compiling.
      return assertUnreachable(type, "unrecognized filter when calculating poet cities");
  }
}

/**
 * Flattens rows to the subset popups need, collapsing the citation columns into
 * a single reference. In genre mode the citation comes from genres.csv instead.
 * @param {AnyPoetCity[]} filteredPoetCities
 * @param {Data} data
 * @param {State} state
 * @returns {RenderedPoetCity[]}
 */
function renderPoetCities(filteredPoetCities, data, state) {
  const [type, num] = getPlacesFilter(state);

  return filteredPoetCities.map(pc => {
    /** @type {Reference} */
    const reference = {
      source_citation: pc.source_citation,
      source_greektext: pc.source_greektext,
      source_translation: pc.source_translation,
      source_translator: pc.source_translator
    };
    if (type === "genre") {
      const genrePoetCities = data.genresByPoetId[pc.poetId].filter(genre => genre.genreId === num);
      if (genrePoetCities.length > 1) {
        console.log(`poet with name ${pc.poetname} and ${pc.poetId} has more than one entry for genreId ${num}`);
      }
      if (genrePoetCities.length === 0) {
        console.log(
          `poet with name ${pc.poetname} and ${pc.poetId} has no entries for genreId ${num} (though we filtered to this genreId)`
        );
      }
      const genrePoetCity = genrePoetCities[0];
      reference.source_citation = genrePoetCity.source_citation;
      reference.source_greektext = genrePoetCity.source_greektext;
      reference.source_translation = genrePoetCity.source_translation;
      reference.source_translator = genrePoetCity.source_translator;
    }

    /** @type {RenderedPoetCity} */
    const renderedPc = {
      poetId: pc.poetId,
      cityId: pc.cityId,
      cityname: pc.cityname,
      poetname: pc.poetname,
      poetDetailName: pc.poetDetailName,
      poetDates: pc.poetDates,
      poetGenres: pc.poetGenres,
      poetSources: pc.poetSources,
      relationshipId: pc.relationshipId,
      reference: reference
    };
    // Only geographical-imaginary rows carry a source_poem column.
    if ("source_poem" in pc && pc.source_poem) renderedPc.reference.source_poem = pc.source_poem;
    return renderedPc;
  });
}
