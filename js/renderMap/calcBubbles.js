import { sortAlphabetically } from "../calcData/data.js";
import { createPopupHtml } from "../popups/popups.js";

/**
 * Groups rendered rows by city into one bubble per city, sized by how many
 * poets it holds, and attaches each bubble's popup html.
 * @param {State} state
 * @param {Data} data
 * @param {RenderedPoetCity[]} poetCities
 * @returns {Record<number, Bubble>}
 */
export function calculateBubbles(state, data, poetCities) {
  /** @type {Record<number, Bubble>} */
  const bubbles = {};

  for (const [key, rows] of Object.entries(groupRowsByCity(data, poetCities))) {
    const cityId = Number(key);
    // The contents are assembled first because the popup is rendered from them,
    // and from nothing that is added alongside it. That ordering is what lets a
    // bubble be built complete instead of filled in field by field.
    /** @type {BubbleContents} */
    const contents = { city: data.citiesById[cityId], poetCities: rows };
    if (state.currentMapMode === "geoimaginaryMode") contents.poets = groupRowsByPoet(rows);

    bubbles[cityId] = {
      ...contents,
      price: calculateBubblePriceFromNumberOfPoets(rows.length),
      popupHtml: createPopupHtml(state, data, contents),
      legend: contents.city.cityname
    };
  }

  return bubbles;
}

/**
 * Buckets rows by the city they point at, dropping any that name a city missing
 * from cities.csv.
 * @param {Data} data
 * @param {RenderedPoetCity[]} poetCities
 * @returns {Record<number, RenderedPoetCity[]>}
 */
function groupRowsByCity(data, poetCities) {
  /** @type {Record<number, RenderedPoetCity[]>} */
  const rowsByCity = {};
  for (const poetCity of poetCities) {
    const cityId = poetCity.cityId;
    if (!cityId || !data.citiesById[cityId]) continue;
    if (!rowsByCity[cityId]) rowsByCity[cityId] = [];
    rowsByCity[cityId].push(poetCity);
  }
  return rowsByCity;
}

/**
 * Collapses one city's rows to one entry per poet, carrying every citation that
 * poet made to it. Geographical imaginary only, where a poet often names the
 * same place several times.
 * @param {RenderedPoetCity[]} rows
 * @returns {GeoBubblePoet[]}
 */
function groupRowsByPoet(rows) {
  /** @type {Record<number, GeoBubblePoet>} */
  const poetsById = {};
  for (const row of rows) {
    if (!poetsById[row.poetId]) poetsById[row.poetId] = { ...row, references: [] };
    poetsById[row.poetId].references.push(row.reference);
  }
  return Object.values(poetsById).sort((a, b) => sortAlphabetically(a.poetname, b.poetname));
}

/**
 * @param {number} numberOfPoets
 * @returns {number}
 */
function calculateBubblePriceFromNumberOfPoets(numberOfPoets) {
  if (numberOfPoets <= 1) return 10.0;
  if (numberOfPoets <= 2) return 13.3;
  if (numberOfPoets <= 3) return 15.0;
  if (numberOfPoets <= 4) return 16.7;
  if (numberOfPoets <= 6) return 18.3;
  if (numberOfPoets <= 8) return 21.7;
  if (numberOfPoets <= 15) return 25.0;
  return 28.0;
}
