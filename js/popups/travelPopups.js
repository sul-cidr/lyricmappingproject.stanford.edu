import { LYRIC_GREY, LYRIC_RED } from "../constants/colors.js";
import {
  createNumberedListOfPoets,
  createDetailedListOfPoets,
  renderReference,
  renderOtherBirthplaces
} from "./popupsCommon.js";
import { getPoetDisplay } from "../calcData/getters.js";

/**
 * Builds the html shown when a travel arc is clicked.
 * @param {Data} data
 * @param {TravelArc} line
 * @returns {string}
 */
export function createTravelPopupHtml(data, line) {
  return `
  <h3 style="color:${LYRIC_GREY}">${line.name}</h3>
  <h5 style="color:${LYRIC_GREY}">POET(S)</h5>
  ${createNumberedListOfPoets(line.poetLines.map(pl => getPoetDisplay(data, pl.poetId).detailName))}
  <h4 style="color:${LYRIC_GREY}">DETAILS</h4>
  ${createDetailedListOfPoets(line.poetLines, data)}
  <h4 style="color:${LYRIC_GREY}">ORIGIN SOURCE</h4>
  ${createTravelSource(line, "bornPc", data)}
  <h4 style="color:${LYRIC_GREY}">ACTIVITY SOURCE</h4>
  ${createTravelSource(line, "activePc", data)}
  `;
}

/**
 * Renders the citation behind either end of an arc, for every poet on it.
 *
 * The ORIGIN SOURCE end also names the poet's other attested birthplaces. That
 * matters more here than in a bubble popup: an arc asserts a journey out of one
 * city, and for the thirteen poets whose origin is disputed the map draws one
 * arc per tradition without ever saying that is what they are. It is also what
 * has to be in place before the zero-length lines can be dropped — those are
 * precisely the cases where the poet was born and active in the same city, so
 * removing them silently deletes a birthplace from the travel map unless the
 * remaining arcs mention it.
 * @param {TravelArc} line
 * @param {"bornPc" | "activePc"} direction which end of the journey to cite
 * @param {Data} data
 * @returns {string}
 */
function createTravelSource(line, direction, data) {
  return line.poetLines
    .map((pl, idx) => {
      return `
    <p>
    <span style="color:${LYRIC_RED}">${idx + 1}</span>. ${getPoetDisplay(data, pl.poetId).detailName}<br>
    ${renderReference(pl[direction])}
    ${renderOtherBirthplaces(data, pl[direction])}
    </p>
    `;
    })
    .join("");
}

/**
 * As createTravelPopupHtml, but the details block reports regimes rather than
 * genres and sources.
 * @param {Data} data
 * @param {TravelArc} line
 * @returns {string}
 */
export function createGovTravelPopupHtml(data, line) {
  return `
  <h3 style="color:${LYRIC_GREY}">${line.name}</h3>
  <h5 style="color:${LYRIC_GREY}">POET(S)</h5>
  ${createNumberedListOfPoets(line.poetLines.map(pl => getPoetDisplay(data, pl.poetId).detailName))}
  <h4 style="color:${LYRIC_GREY}">DETAILS</h4>
  ${createRegimeTravelListOfPoets(line.poetLines, data)}
  <h4 style="color:${LYRIC_GREY}">ORIGIN SOURCE</h4>
  ${createTravelSource(line, "bornPc", data)}
  <h4 style="color:${LYRIC_GREY}">ACTIVITY SOURCE</h4>
  ${createTravelSource(line, "activePc", data)}
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
        <span style="color:${LYRIC_RED}">${idx + 1}</span>. ${getPoetDisplay(data, poet.poetId).detailName}<br>
        Regime (data from Hansen and Nielsen): ${renderGovNames(poet.bornGovIds, data)} -> ${renderGovNames(poet.activeGovIds, data)}<br>
        Dates: ${getPoetDisplay(data, poet.poetId).dates}<br>
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
