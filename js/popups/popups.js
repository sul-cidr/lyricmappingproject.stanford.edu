import { LYRIC_GREY, LYRIC_RED } from "../constants/colors.js";
import { getPlacesFilter } from "../calcData/getters.js";
import { assertUnreachable } from "../assertUnreachable.js";
import { createNumberedListOfPoets, createDetailedListOfPoets, renderReference } from "./popupsCommon.js";

/**
 * Builds the html shown when a city bubble is clicked, for whichever of the
 * places / geographical-imaginary maps is showing.
 * @param {State} state
 * @param {Data} data
 * @param {BubbleContents} bubble
 * @returns {string}
 */
export function createPopupHtml(state, data, bubble) {
  switch (state.currentMapMode) {
    case "placesMode": {
      const [type, num] = getPlacesFilter(state);
      // Relationship 3 is "activity", which gets its own native/non-native split.
      return type === "relationship" && num === 3
        ? createActivePopupHtml(data, bubble)
        : createPlacesPopupHtml(data, bubble, type, num);
    }
    case "geoimaginaryMode":
      // Its title counts references rather than naming a filter, so unlike the
      // places map it does not need to know which button is selected.
      return createGeoImaginaryPopupHtml(bubble);
    case "travelMode":
      // The travel map draws arcs and builds its popups in travelPopups.js.
      throw new Error("createPopupHtml is not used by the travel map");
    default:
      return assertUnreachable(state.currentMapMode, "unrecognized map mode");
  }
}

/**
 * The ACTIVITY popup, which splits a city's poets into natives and incomers.
 * @param {Data} data
 * @param {BubbleContents} bubble
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
 * @param {Data} data
 * @param {BubbleContents} bubble
 * @param {PlacesFilterType} type
 * @param {number} num
 * @returns {string}
 */
function createPlacesPopupHtml(data, bubble, type, num) {
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
 * @param {BubbleContents} bubble
 * @returns {string}
 */
function createGeoImaginaryPopupHtml(bubble) {
  const cityname = bubble.city.infowindowName.toUpperCase();
  // calcBubbles always populates poets in geoimaginaryMode.
  const poets = /** @type {GeoBubblePoet[]} */ (bubble.poets);
  const referenceStr = bubble.poetCities.length === 1 ? "REFERENCE" : "REFERENCES";
  return `
    ${createHeader(cityname, `${bubble.poetCities.length} ${referenceStr} TO ${cityname}`)}
    ${createGeoHeaderListOfPoets(poets)}
    <h4 style="color:${LYRIC_GREY}">DETAILS</h4>
    ${createDetailedGeoListOfPoets(poets)}
  `;
}
