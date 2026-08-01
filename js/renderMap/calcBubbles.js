import { sortAlphabetically } from "../calcData/data.js";
import { createPlacesPopupHtml, createGeoPopupHtml } from "../popups/popups.js";

/**
 * Groups rendered rows by city into one bubble per city, sized by how many
 * poets it holds, and attaches each bubble's popup html.
 *
 * One function per map rather than one taking the mode, because the two build
 * different bubbles: only the geographical imaginary groups its rows by poet.
 * Returning the narrower type is what lets its popup read `poets` without a
 * cast asserting that this really was the geographical imaginary after all.
 * @param {Data} data
 * @param {PlacesFilter} filter
 * @param {RenderedPoetCity[]} poetCities
 * @returns {Record<number, PlacesBubble>}
 */
export function calculatePlacesBubbles(data, filter, poetCities) {
  /** @type {Record<number, PlacesBubble>} */
  const bubbles = {};
  for (const [cityId, rows] of groupRowsByCity(data, poetCities)) {
    /** @type {PlacesBubbleContents} */
    const contents = { city: data.citiesById[cityId], poetCities: rows };
    bubbles[cityId] = { ...contents, ...drawnAs(contents, createPlacesPopupHtml(data, contents, filter)) };
  }
  return bubbles;
}

/**
 * As calculatePlacesBubbles, for the geographical imaginary map.
 * @param {Data} data
 * @param {RenderedPoetCity[]} poetCities
 * @returns {Record<number, GeoBubble>}
 */
export function calculateGeoBubbles(data, poetCities) {
  /** @type {Record<number, GeoBubble>} */
  const bubbles = {};
  for (const [cityId, rows] of groupRowsByCity(data, poetCities)) {
    /** @type {GeoBubbleContents} */
    const contents = { city: data.citiesById[cityId], poetCities: rows, poets: groupRowsByPoet(rows) };
    bubbles[cityId] = { ...contents, ...drawnAs(contents, createGeoPopupHtml(contents, data)) };
  }
  return bubbles;
}

/**
 * What every bubble gets once its contents are known: the size it is drawn at,
 * the popup it opens and the label beneath it.
 *
 * Taken as an argument rather than rendered here, because the popup is the one
 * thing the two maps do not share.
 * @param {PlacesBubbleContents} contents
 * @param {string} popupHtml
 * @returns {{ price: number, popupHtml: string, legend: string }}
 */
function drawnAs(contents, popupHtml) {
  return {
    price: calculateBubblePriceFromNumberOfPoets(contents.poetCities.length),
    popupHtml,
    legend: contents.city.cityname
  };
}

/**
 * Buckets rows by the city they point at, dropping any that name a city missing
 * from cities.csv.
 * @param {Data} data
 * @param {RenderedPoetCity[]} poetCities
 * @returns {[number, RenderedPoetCity[]][]}
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
  return Object.entries(rowsByCity).map(([cityId, rows]) => [Number(cityId), rows]);
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
