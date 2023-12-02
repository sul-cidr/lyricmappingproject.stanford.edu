import { LYRIC_RED } from "../constants/colors.js";

export function createNumberedListOfPoets(names) {
  return (`
    <p>
    ${names.map((name, idx) =>
    `<span style="color:${LYRIC_RED}">${idx + 1}</span>. ${name}`
  ).join(" ")}
    </p>
  `);
}

export function createDetailedListOfPoets(poets) {
  return (`
    ${poets.map((poet, idx) => {
    return (`
      <p>
        <span style="color:${LYRIC_RED}">${idx + 1}</span>. ${poet.poetDetailName}<br>
        Dates: ${poet.poetDates}<br>
        Genre(s): ${poet.poetGenres}<br>
        Source(s): ${poet.poetSources}<br>
        ${renderReference(poet.reference)}
      </p >
      `);
  }).join(" ")}
  `);
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