import { LYRIC_RED } from "../constants/colors.js";
import { getGenres, getPoetDisplay } from "../calcData/getters.js";

/**
 * Anything a detail paragraph can be rendered from: a rendered poet-city row in
 * places / geographical-imaginary mode, or a travel line in travel mode. Travel
 * lines carry no citation of their own, hence the optional reference.
 *
 * A poetId is now the whole of it. The display strings used to be carried on the
 * row as well, which is why this was an intersection with PoetPrimed.
 * @typedef {{ poetId: number, reference?: Reference }} DetailedPoet
 */

/**
 * The red-numbered one-line summary at the top of a popup.
 * @param {string[]} names
 * @returns {string}
 */
export function createNumberedListOfPoets(names) {
  return `
    <p>
    ${names.map((name, idx) => `<span style="color:${LYRIC_RED}">${idx + 1}</span>. ${name}`).join(" ")}
    </p>
  `;
}

/**
 * The DETAILS block: one paragraph per poet, with dates, genres, sources and
 * the citation.
 * @param {DetailedPoet[]} poets
 * @param {Data} data
 * @returns {string}
 */
export function createDetailedListOfPoets(poets, data) {
  return `
    ${poets
      .map((poet, idx) => {
        const display = getPoetDisplay(data, poet.poetId);
        return `
      <p>
        <span style="color:${LYRIC_RED}">${idx + 1}</span>. ${display.detailName}<br>
        Dates: ${display.dates}<br>
        ${createGenreString(data, poet.poetId)}
        Source(s): ${display.sources}<br>
        ${renderReference(poet.reference)}
      </p>
      `;
      })
      .join(" ")}
  `;
}

/**
 * This always looked the genres up — it needed the count to choose between
 * "Genre" and "Genres" — and read the joined names off the primed row beside it.
 * Now it joins the names it already has.
 * @param {Lookups} lookups
 * @param {number} poetId
 * @returns {string}
 */
function createGenreString(lookups, poetId) {
  const genres = getGenres(lookups, poetId);
  const genreNames = genres.map(genre => genre.genre).join(", ");
  // Blank when a poet has no genres, and also when the ones they have are
  // unnamed, which is what reading the joined string off the row did.
  if (!genreNames) return "";
  return `${genres.length > 1 ? "Genres" : "Genre"}: ${genreNames}<br>`;
}

/**
 * @param {Reference | undefined} reference
 * @returns {string}
 */
export function renderReference(reference) {
  if (reference) {
    let source_poem = "";
    if (reference.source_poem) source_poem = `${reference.source_poem}.`;
    return `
    Citation: ${source_poem}${reference.source_citation}: "${reference.source_translation}" (trans. ${reference.source_translator})<br>
    Greek: ${reference.source_greektext}
    `;
  } else {
    return "";
  }
}
