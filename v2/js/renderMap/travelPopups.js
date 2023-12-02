import { LYRIC_GREY, LYRIC_RED } from "../constants/colors.js";
import { createNumberedListOfPoets, createDetailedListOfPoets, renderReference } from "./popupsCommon.js";

export function createTravelPopupHtml(state, data, line) {
  return (`
  <h3 style="color:${LYRIC_GREY}">${line.name}</h3>
  <h5 style="color:${LYRIC_GREY}">POET(S)</h5>
  ${createNumberedListOfPoets(line.poetLines.map(pl => pl.poetDetailName))}
  <h4 style="color:${LYRIC_GREY}">DETAILS</h4>
  ${createDetailedListOfPoets(line.poetLines, data)}
  <h4 style="color:${LYRIC_GREY}">ORIGIN SOURCE</h4>
  ${createTravelSource(line, "bornPc")}
  <h4 style="color:${LYRIC_GREY}">ACTIVITY SOURCE</h4>
  ${createTravelSource(line, "activePc")}
  `);
}

function createTravelSource(line, direction) {
  return line.poetLines.map((pl, idx) => {
    return (`
    <p>
    <span style="color:${LYRIC_RED}">${idx + 1}</span>. ${pl.poetDetailName}<br>
    ${renderReference(pl[direction])}
    </p>
    `)
  }).join("")
}