import { LYRIC_GREY, LYRIC_RED } from "../constants/colors.js";
import { getPlacesFilter } from "../calcData/getters.js";
import { assertUnreachable } from "../assertUnreachable.js";
import { createNumberedListOfPoets, createDetailedListOfPoets, renderReference } from "./popupsCommon.js";

/**
 * Builds the html shown when a city bubble is clicked, for whichever of the
 * places / geographical-imaginary maps is showing.
 * @param {State} state
 * @param {Data} data
 * @param {Bubble} bubble
 * @returns {string}
 */
export function createPopupHtml(state, data, bubble) {
  const [type, num] = getPlacesFilter(state);
  switch (state.currentMapMode) {
    case "placesMode":
      // Relationship 3 is "activity", which gets its own native/non-native split.
      return type === "relationship" && num === 3
        ? createActivePopupHtml(data, bubble)
        : createPlacesPopupHtml(state, data, bubble);
    case "geoimaginaryMode":
      return createGeoImaginaryPopupHtml(state, data, bubble);
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
 * @param {Bubble} bubble
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
 * @param {State} state
 * @param {Data} data
 * @param {Bubble} bubble
 * @returns {string}
 */
function createHeader(state, data, bubble) {
  const cityname = bubble.city.infowindowName.toUpperCase();
  const title = createTitle(state, data, cityname, bubble);
  return `
    <h3 style="color:${LYRIC_GREY}">${cityname}</h3>
    <h5 style="color:${LYRIC_GREY}">${title}</h5>
  `;
}

/**
 * @param {State} state
 * @param {Data} data
 * @param {Bubble} bubble
 * @returns {string}
 */
function createPlacesPopupHtml(state, data, bubble) {
  const poetCities = bubble.poetCities;
  return `
    ${createHeader(state, data, bubble)}
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
 * @param {State} state
 * @param {Data} data
 * @param {string} cityname already upper-cased
 * @param {Bubble} bubble
 * @returns {string}
 */
function createTitle(state, data, cityname, bubble) {
  switch (state.currentMapMode) {
    case "placesMode":
      return createPlacesModeTitle(state, data, cityname);
    case "geoimaginaryMode": {
      const referenceStr = bubble.poetCities.length === 1 ? "REFERENCE" : "REFERENCES";
      return `${bubble.poetCities.length} ${referenceStr} TO ${cityname}`;
    }
    case "travelMode":
      throw new Error("createTitle is not used by the travel map");
    default:
      return assertUnreachable(state.currentMapMode, "unrecognized map mode");
  }
}

/**
 * @param {State} state
 * @param {Data} data
 * @param {string} cityname already upper-cased
 * @returns {string}
 */
function createPlacesModeTitle(state, data, cityname) {
  const [type, num] = getPlacesFilter(state);
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
    case "all":
      // Offered by the geographical imaginary control bar, which titles its
      // popups in createTitle rather than here.
      throw new Error("the places map has no ALL filter");
    default:
      return assertUnreachable(type, "unrecognized places filter");
  }
}

/**
 * @param {State} state
 * @param {Data} data
 * @param {Bubble} bubble
 * @returns {string}
 */
function createGeoImaginaryPopupHtml(state, data, bubble) {
  // calcBubbles always populates poets in geoimaginaryMode.
  const poets = /** @type {GeoBubblePoet[]} */ (bubble.poets);
  return `
    ${createHeader(state, data, bubble)}
    ${createGeoHeaderListOfPoets(poets)}
    <h4 style="color:${LYRIC_GREY}">DETAILS</h4>
    ${createDetailedGeoListOfPoets(poets)}
  `;
}
