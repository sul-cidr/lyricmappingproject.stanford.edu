import { getMapTypeNum } from "../calcData/getters.js";
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
  const filteredPoetCities =
    poetCitiesData
      .filter(getDateFilterFn(data, state))
      .filter(getFilterFn(data, state));

  const renderedPoetCities = renderPoetCities(filteredPoetCities, data, state);

  return renderedPoetCities;
}

/**
 * @param {Data} data
 * @param {State} state
 * @returns {AnyPoetCity[]}
 */
function getPoetCitiesData(data, state) {
  /** @type {AnyPoetCity[] | undefined} */
  let poetCitiesData;
  if (state.currentMapMode === "placesMode" || state.currentMapMode === "travelMode") {
    poetCitiesData = data.poetCities;
  } else if (state.currentMapMode === "geoimaginaryMode") {
    poetCitiesData = data.geopoetCities;
  } else {
    alert(`unrecognized current map mode ${state.currentMapMode}`);
  }
  // Cast: the else branch above is unreachable for a valid State, and alerting
  // then throwing on the spread is the long-standing behaviour.
  return [.../** @type {AnyPoetCity[]} */ (poetCitiesData)];
}

/**
 * Builds the predicate for whichever radio button is currently selected.
 * @param {Data} data
 * @param {State} state
 * @returns {PoetCityFilter}
 */
function getFilterFn(data, state) {
  const [type, num] = getMapTypeNum(state);
  /** @type {PoetCityFilter | undefined} */
  let filterFn;
  if (type === "all") {
    filterFn = () => true;
  }
  else if (type === "relationship") {
    if (num === 3) filterFn = () => true;
    else filterFn = poetCity => poetCity.relationshipId === num;
  }
  else if (type === "poet") {
    filterFn = poetCity => poetCity.poetId === num;
  }
  else if (type === "genre") {
    filterFn = poetCity => {
      return !!data.genresByPoetId[poetCity.poetId] &&
        data
          .genresByPoetId[poetCity.poetId]
          .map(genre => genre.genreId)
          .includes(num) &&
        poetCity.relationshipId === 1;
    }
  } else {
    alert(`${type} not recognized when trying to calculate poet cities`);
  }
  // Cast: an unrecognized type alerts and then fails at the .filter() call,
  // which is the long-standing behaviour.
  return /** @type {PoetCityFilter} */ (filterFn);
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
  const [type, num] = getMapTypeNum(state);

  return filteredPoetCities.map(pc => {
    /** @type {Reference} */
    const reference = {
      source_citation: pc.source_citation,
      source_greektext: pc.source_greektext,
      source_translation: pc.source_translation,
      source_translator: pc.source_translator
    }
    if (type === "genre") {
      const genrePoetCities = data
        .genresByPoetId[pc.poetId]
        .filter(genre => genre.genreId === num);
      if (genrePoetCities.length > 1) {
        console.log(`poet with name ${pc.poetname} and ${pc.poetId} has more than one entry for genreId ${num}`);
      }
      if (genrePoetCities.length === 0) {
        console.log(`poet with name ${pc.poetname} and ${pc.poetId} has no entries for genreId ${num} (though we filtered to this genreId)`);
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
