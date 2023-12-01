import { LYRIC_GREY } from "../constants/colors.js";
import { createNumberedListOfPoets, createDetailedListOfPoets } from "./popupsCommon.js";

export function createTravelPopupHtml(state, data, line) {
  console.log(line);
  return (`
  <h3 style="color:${LYRIC_GREY}">${line.name}</h3>
  <h5 style="color:${LYRIC_GREY}">POET(S)</h5>
  ${createNumberedListOfPoets(line.poetLines.map(pl => pl.poets_details_name))}
  <h4 style="color:${LYRIC_GREY}">DETAILS</h4>
  ${createDetailedListOfPoets(line.poetLines, data)}
  `);
}