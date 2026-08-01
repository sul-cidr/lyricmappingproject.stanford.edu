import { LYRIC_GREY, LYRIC_RED } from "../constants/colors.js";
import { assertUnreachable } from "../assertUnreachable.js";
import { createNumberedListOfPoets, createDetailedListOfPoets, renderReference } from "./popupsCommon.js";

/**
 * Builds the html shown when a city bubble on the places map is clicked.
 *
 * Entered directly by calculatePlacesBubbles() rather than through a function
 * that switched on the map mode. That switch had a branch for the travel map,
 * which draws arcs and builds its popups in travelPopups.js, so it could only
 * throw.
 * @param {Data} data
 * @param {PlacesBubbleContents} bubble
 * @param {PlacesFilter} filter
 * @returns {string}
 */
export function createPlacesPopupHtml(data, bubble, filter) {
  const { type, num } = filter;
  // Relationship 3 is "activity", which gets its own native/non-native split.
  if (type === "relationship" && num === 3) return createActivePopupHtml(data, bubble);

  const cityname = bubble.city.infowindowName.toUpperCase();
  const poetCities = bubble.poetCities;
  return `
    ${createHeader(cityname, createPlacesModeTitle(data, cityname, type, num))}
    ${createNumberedListOfPoets(poetCities.map(pc => pc.poetDetailName))}
    <h4 style="color:${LYRIC_GREY}">DETAILS</h4>
    ${createDetailedListOfPoets(poetCities, data)}
  `;
}

/**
 * The ACTIVITY popup, which splits a city's poets into natives and incomers.
 * @param {Data} data
 * @param {PlacesBubbleContents} bubble
 * @returns {string}
 */
function createActivePopupHtml(data, bubble) {
  const cityname = bubble.city.infowindowName.toUpperCase();
  const poetCities = bubble.poetCities;
  /** @type {RenderedPoetCity[]} */
  const bornPoetCities = [];
  /** @type {RenderedPoetCity[]} */
  const otherPoetCities = [];
  for (const pc of poetCities) {
    if (pc.relationshipId === 1) bornPoetCities.push(pc);
    else otherPoetCities.push(pc);
  }
  const nonNativeTitle = `NON-NATIVE LYRIC ACTIVITY IN ${cityname}`;
  const nativeTitle = `NATIVE LYRIC ACTIVITY IN ${cityname}`;

  let nonNativeHeader = "";
  let nativeHeader = "";
  let nonNativeDetails = "";
  let nativeDetails = "";

  if (bornPoetCities.length > 0) {
    nativeHeader = `
      <h5 style="color:${LYRIC_GREY}">${nativeTitle}</h2>
      ${createNumberedListOfPoets(bornPoetCities.map(pc => pc.poetDetailName))}
    `;
    nativeDetails = `
      <h4 style="color:${LYRIC_GREY}">NATIVE POETS</h4>
      ${createDetailedListOfPoets(bornPoetCities, data)}
    `;
  }

  if (otherPoetCities.length > 0) {
    nonNativeHeader = `
      <h5 style="color:${LYRIC_GREY}">${nonNativeTitle}</h2>
      ${createNumberedListOfPoets(otherPoetCities.map(pc => pc.poetDetailName))}
    `;
    nonNativeDetails = `
      <h4 style="color:${LYRIC_GREY}">NON-NATIVE POETS</h4>
      ${createDetailedListOfPoets(otherPoetCities, data)}
    `;
  }

  return `
    <h3 style="color:${LYRIC_GREY}">${cityname}</h2>
    ${nonNativeHeader}
    ${nativeHeader}
    <h4 style="color:${LYRIC_GREY}">DETAILS</h4>
    ${nonNativeDetails}
    ${nativeDetails}
  `;
}

/**
 * @param {string} cityname already upper-cased
 * @param {string} title
 * @returns {string}
 */
function createHeader(cityname, title) {
  return `
    <h3 style="color:${LYRIC_GREY}">${cityname}</h3>
    <h5 style="color:${LYRIC_GREY}">${title}</h5>
  `;
}

/**
 * @param {GeoBubblePoet[]} poets
 * @returns {string}
 */
function createGeoHeaderListOfPoets(poets) {
  return `
    <p>
    ${poets
      .map((poet, idx) => {
        const referenceStr = poet.references.length > 1 ? "references" : "reference";
        return `<span style="color:${LYRIC_RED}">${idx + 1}</span>. ${poet.poetname}: ${poet.references.length} ${referenceStr}`;
      })
      .join("<br>")}
    </p>
  `;
}

/**
 * @param {GeoBubblePoet[]} poets
 * @returns {string}
 */
function createDetailedGeoListOfPoets(poets) {
  return `
    ${poets
      .map((poet, idx) => {
        return `
      <p>
        <span style="color:${LYRIC_RED}">${idx + 1}</span>. ${poet.poetname}<br>
        Dates: ${poet.poetDates}<br>
        ${poet.references.map(reference => renderReference(reference)).join("<br><br>")}
      </p >
      `;
      })
      .join(" ")}
  `;
}

/**
 * Names the filter the bubble is being shown under. Exhaustive over the three
 * filters the places control bar offers, and there is no fourth: the ALL that
 * used to need a throw here belongs to the geographical imaginary map, which
 * titles its own popups below.
 * @param {Data} data
 * @param {string} cityname already upper-cased
 * @param {PlacesFilterType} type
 * @param {number} num
 * @returns {string}
 */
function createPlacesModeTitle(data, cityname, type, num) {
  switch (type) {
    case "relationship":
      // Relationship 3 is "activity", which never reaches here: it is handled
      // by createActivePopupHtml, which writes its own headings.
      return `POETS BORN IN ${cityname}`;
    case "poet":
      return `POET ACTIVE IN ${cityname}`;
    case "genre": {
      const genrename = data.genresByGenreId[num].toUpperCase();
      return `POET BORN IN ${cityname} AND ASSOCIATED WITH ${genrename}`;
    }
    default:
      return assertUnreachable(type, "unrecognized places filter");
  }
}

/**
 * Builds the html shown when a city bubble on the geographical imaginary map is
 * clicked. Its title counts references rather than naming a filter, so unlike
 * the places map it never needs to know which button is selected.
 *
 * `bubble.poets` is read straight off a GeoBubbleContents. It used to be an
 * optional field on a type shared with the places map, so this was the one
 * place left that had to cast.
 * @param {GeoBubbleContents} bubble
 * @returns {string}
 */
export function createGeoPopupHtml(bubble) {
  const cityname = bubble.city.infowindowName.toUpperCase();
  const referenceStr = bubble.poetCities.length === 1 ? "REFERENCE" : "REFERENCES";
  return `
    ${createHeader(cityname, `${bubble.poetCities.length} ${referenceStr} TO ${cityname}`)}
    ${createGeoHeaderListOfPoets(bubble.poets)}
    <h4 style="color:${LYRIC_GREY}">DETAILS</h4>
    ${createDetailedGeoListOfPoets(bubble.poets)}
  `;
}
