import { LYRIC_GREY, LYRIC_RED } from "../constants/colors.js";
import { createNumberedListOfPoets, createDetailedListOfPoets, renderReference } from "./popupsCommon.js";

/**
 * Builds the html shown when a travel arc is clicked.
 * @param {Data} data
 * @param {DrawnLine} line
 * @returns {string}
 */
export function createTravelPopupHtml(data, line) {
  return `
  <h3 style="color:${LYRIC_GREY}">${line.name}</h3>
  <h5 style="color:${LYRIC_GREY}">POET(S)</h5>
  ${createNumberedListOfPoets(line.poetLines.map(pl => pl.poetDetailName))}
  <h4 style="color:${LYRIC_GREY}">DETAILS</h4>
  ${createDetailedListOfPoets(line.poetLines, data)}
  <h4 style="color:${LYRIC_GREY}">ORIGIN SOURCE</h4>
  ${createTravelSource(line, "bornPc")}
  <h4 style="color:${LYRIC_GREY}">ACTIVITY SOURCE</h4>
  ${createTravelSource(line, "activePc")}
  `;
}

/**
 * Renders the citation behind either end of an arc, for every poet on it.
 * @param {DrawnLine} line
 * @param {"bornPc" | "activePc"} direction which end of the journey to cite
 * @returns {string}
 */
function createTravelSource(line, direction) {
  return line.poetLines
    .map((pl, idx) => {
      return `
    <p>
    <span style="color:${LYRIC_RED}">${idx + 1}</span>. ${pl.poetDetailName}<br>
    ${renderReference(pl[direction])}
    </p>
    `;
    })
    .join("");
}

/**
 * As createTravelPopupHtml, but the details block reports regimes rather than
 * genres and sources.
 * @param {Data} data
 * @param {DrawnLine} line
 * @returns {string}
 */
export function createGovTravelPopupHtml(data, line) {
  return `
  <h3 style="color:${LYRIC_GREY}">${line.name}</h3>
  <h5 style="color:${LYRIC_GREY}">POET(S)</h5>
  ${createNumberedListOfPoets(line.poetLines.map(pl => pl.poetDetailName))}
  <h4 style="color:${LYRIC_GREY}">DETAILS</h4>
  ${createRegimeTravelListOfPoets(line.poetLines, data)}
  <h4 style="color:${LYRIC_GREY}">ORIGIN SOURCE</h4>
  ${createTravelSource(line, "bornPc")}
  <h4 style="color:${LYRIC_GREY}">ACTIVITY SOURCE</h4>
  ${createTravelSource(line, "activePc")}
  `;
}

/**
 * @param {Line[]} poets
 * @param {Data} data
 * @returns {string}
 */
function createRegimeTravelListOfPoets(poets, data) {
  return `
    ${poets
      .map((poet, idx) => {
        return `
      <p>
        <span style="color:${LYRIC_RED}">${idx + 1}</span>. ${poet.poetDetailName}<br>
        Regime (data from Hansen and Nielsen): ${renderGovNames(poet.bornGovIds, data)} -> ${renderGovNames(poet.activeGovIds, data)}<br>
        Dates: ${poet.poetDates}<br>
      </p>
      `;
      })
      .join(" ")}
  `;
}

/**
 * @param {number[]} govIds
 * @param {Data} data
 * @returns {string}
 */
function renderGovNames(govIds, data) {
  return govIds.map(govId => data.govsById[govId]).join(", ");
}
