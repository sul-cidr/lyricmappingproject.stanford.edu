import { LYRIC_RED } from "../constants/colors.js";
import { getGenres, getPoetDisplay, getOtherBirthplaces } from "../calcData/getters.js";

/**
 * Anything a detail paragraph can be rendered from: a rendered poet-city row in
 * places / geographical-imaginary mode, or a travel line in travel mode. Travel
 * lines carry no citation of their own, hence the optional reference.
 *
 * A poetId is now the whole of it. The display strings used to be carried on the
 * row as well, which is why this was an intersection with PoetPrimed.
 *
 * cityId and relationshipId are optional for the same reason the reference is:
 * a Line has neither, since it is a journey between two cities rather than a
 * claim about one. They are what renderOtherBirthplaces() needs to tell a
 * birthplace entry from any other, and a RenderedPoetCity carries both.
 * @typedef {{ poetId: number, cityId?: number, relationshipId?: RelationshipId, reference?: Reference }} DetailedPoet
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
        ${renderOtherBirthplaces(data, poet)}
      </p>
      `;
      })
      .join(" ")}
  `;
}

/**
 * "See also: Sardis" under a birthplace whose poet has others attested.
 *
 * The CartoDB map derived this in SQL and showed it inside the citation block,
 * which is how issues #208, #218 and the second half of #257 were closed; the
 * rewrite dropped it, so the map has been asserting one birthplace per bubble
 * with nothing to say the sources disagree. Rendered here rather than written
 * into a notes column so that it cannot fall out of step with the rows it
 * describes — the note added by hand for #257 overwrote Alcman's citation and
 * has been wrong ever since.
 *
 * Birthplaces only. A place of activity has no alternatives to offer, and a
 * travel line reaches this without a cityId at all.
 * @param {Data} data
 * @param {DetailedPoet} poet
 * @returns {string}
 */
export function renderOtherBirthplaces(data, poet) {
  if (poet.relationshipId !== 1 || poet.cityId === undefined) return "";
  const others = getOtherBirthplaces(data, poet.poetId, poet.cityId);
  if (others.length === 0) return "";
  return `<br>See also: ${others.join(", ")}`;
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
