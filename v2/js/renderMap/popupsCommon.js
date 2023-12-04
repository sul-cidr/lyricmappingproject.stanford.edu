import { LYRIC_RED } from "../constants/colors.js";
import { getGenres } from "../calcData/getters.js";

export function createNumberedListOfPoets(names) {
  return (`
    <p>
    ${names.map((name, idx) =>
    `<span style="color:${LYRIC_RED}">${idx + 1}</span>. ${name}`
  ).join(" ")}
    </p>
  `);
}

export function createDetailedListOfPoets(poets, data) {
  return (`
    ${poets.map((poet, idx) => {
    return (`
      <p>
        <span style="color:${LYRIC_RED}">${idx + 1}</span>. ${poet.poetDetailName}<br>
        Dates: ${poet.poetDates}<br>
        ${createGenreString(poet, data)}
        Source(s): ${poet.poetSources}<br>
        ${renderReference(poet.reference)}
      </p>
      `);
  }).join(" ")}
  `);
}

function createGenreString(poet, data) {
  if (poet.poetGenres) {
    const genres = getGenres(data, poet.poetId)
    const genreStr = genres.length > 1 ? "Genres" : "Genre"
    return `${genreStr}: ${poet.poetGenres}<br>`
  }
  return "";
}

export function renderReference(reference) {
  if (reference) {
    let source_poem = "";
    if (reference.source_poem) source_poem = `${reference.source_poem}.`;
    return (`
    Citation: ${source_poem}${reference.source_citation}: "${reference.source_translation}" (trans. ${reference.source_translator})<br>
    Greek: ${reference.source_greektext}
    `);
  } else {
    return "";
  }
}