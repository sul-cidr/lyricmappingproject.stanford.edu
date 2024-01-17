import { LYRIC_GREY, LYRIC_RED } from "../constants/colors.js";
import { getMapTypeNum } from "../calcData/getters.js";
import { createNumberedListOfPoets, createDetailedListOfPoets, renderReference } from "./popupsCommon.js";

export function createPopupHtml(state, data, bubble) {
  const [type, num] = getMapTypeNum(state);
  if (state.currentMapMode === "placesMode") {
    if (type === "relationship" && num === 3) {
      return createActivePopupHtml(state, data, bubble);
    } else {
      return createPlacesPopupHtml(state, data, bubble);
    }
  } else if (state.currentMapMode === "geoimaginaryMode") {
    return createGeoImaginaryPopupHtml(state, data, bubble);
  }
}

function createActivePopupHtml(state, data, bubble) {
  console.log(data);
  console.log(bubble);
  const cityname = bubble.city.infowindowName.toUpperCase();
  const poetCities = bubble.poetCities;
  const bornPoetCities = [];
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
      ${createNumberedListOfPoets(bornPoetCities.map(pc => pc.poetDetailName), data)}    
    `;
    nativeDetails = `
      <h4 style="color:${LYRIC_GREY}">NATIVE POETS</h4>
      ${createDetailedListOfPoets(bornPoetCities, data)}
    `;
  }

  if (otherPoetCities.length > 0) {
    nonNativeHeader = `
      <h5 style="color:${LYRIC_GREY}">${nonNativeTitle}</h2>
      ${createNumberedListOfPoets(otherPoetCities.map(pc => pc.poetDetailName), data)}    
    `;
    nonNativeDetails = `
      <h4 style="color:${LYRIC_GREY}">NON-NATIVE POETS</h4>
      ${createDetailedListOfPoets(otherPoetCities, data)}
    `;
  }

  return (`
    <h3 style="color:${LYRIC_GREY}">${cityname}</h2>
    ${nonNativeHeader}
    ${nativeHeader}
    <h4 style="color:${LYRIC_GREY}">DETAILS</h4>
    ${nonNativeDetails}
    ${nativeDetails}
  `);
}

function createHeader(state, data, bubble) {
  const cityname = bubble.city.infowindowName.toUpperCase();
  const title = createTitle(state, data, cityname, bubble);
  return (`
    <h3 style="color:${LYRIC_GREY}">${cityname}</h3>
    <h5 style="color:${LYRIC_GREY}">${title}</h5>
  `);
}

function createPlacesPopupHtml(state, data, bubble) {
  const poetCities = bubble.poetCities;
  return (`
    ${createHeader(state, data, bubble)}
    ${createNumberedListOfPoets(poetCities.map(pc => pc.poetDetailName))}
    <h4 style="color:${LYRIC_GREY}">DETAILS</h4>
    ${createDetailedListOfPoets(poetCities, data)}
  `);
}

function createGeoHeaderListOfPoets(poets, data) {
  return (`
    <p>
    ${poets.map((poet, idx) => {
    const referenceStr = poet.references.length > 1 ? "references" : "reference";
    return `<span style="color:${LYRIC_RED}">${idx + 1}</span>. ${poet.poetname}: ${poet.references.length} ${referenceStr}`
  }
  ).join("<br>")}
    </p>
  `);
}

function createDetailedGeoListOfPoets(poets, data) {
  return (`
    ${poets.map((poet, idx) => {
    return (`
      <p>
        <span style="color:${LYRIC_RED}">${idx + 1}</span>. ${poet.poetname}<br>
        Dates: ${poet.poetDates}<br>
        ${poet.references.map(reference => renderReference(reference)).join("<br><br>")}
      </p >
      `);
  }).join(" ")}
  `);
}

function createTitle(state, data, cityname, bubble) {
  if (state.currentMapMode === "placesMode") {
    return createPlacesModeTitle(state, data, cityname);
  } else if (state.currentMapMode === "geoimaginaryMode") {
    const referenceStr = bubble.poetCities.length === 1 ? "REFERENCE" : "REFERENCES";
    return `${bubble.poetCities.length} ${referenceStr} TO ${cityname}`
  }
}

function createPlacesModeTitle(state, data, cityname) {
  const [type, num] = getMapTypeNum(state);
  if (type === "relationship" && num === 1) {
    return `POETS BORN IN ${cityname}`;
  } else if (type === "poet") {
    return `POET ACTIVE IN ${cityname}`;
  } else if (type === "genre") {
    const genrename = data.genresByGenreId[num].toUpperCase();
    return `POET BORN IN ${cityname} AND ASSOCIATED WITH ${genrename}`
  }
}

function createGeoImaginaryPopupHtml(state, data, bubble) {
  return (`
    ${createHeader(state, data, bubble)}
    ${createGeoHeaderListOfPoets(bubble.poets, data)}
    <h4 style="color:${LYRIC_GREY}">DETAILS</h4>
    ${createDetailedGeoListOfPoets(bubble.poets, data)}
  `);
}