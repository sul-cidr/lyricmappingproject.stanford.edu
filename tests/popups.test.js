// Rendering tests for the popups, driven through the real filter pipeline.
//
// The per-map calc functions are pure, so Node can build the exact
// bubbles the browser builds and assert on the html they produce. These are the
// tests to lean on when changing popup copy — notably issue #332, which will
// change how a poet with several reported birthplaces is described.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { loadInitializedData, ALL_DATES } from "./helpers/loadData.js";
import { calcPlacesPoetCities, calcGeoPoetCities } from "../js/renderMap/calcPoetCities.js";
import { calculatePlacesBubbles, calculateGeoBubbles } from "../js/renderMap/calcBubbles.js";
import { createTravelPopupHtml } from "../js/popups/travelPopups.js";

const { data } = loadInitializedData();

/**
 * The bubbles the places map draws for one control bar selection. Takes the
 * filter itself rather than a selectedId, because each map now runs its own
 * pipeline and there is no shared entry point to pass a string to.
 * @param {PlacesFilter} filter
 * @returns {Record<number, PlacesBubble>}
 */
function placesBubblesFor(filter) {
  /** @type {State} */
  const state = { map: { currentMapMode: "placesMode", filter }, ...ALL_DATES };
  return calculatePlacesBubbles(data, filter, calcPlacesPoetCities(data, state, filter));
}

/**
 * As placesBubblesFor, for the geographical imaginary map.
 * @param {GeoFilter} filter
 * @returns {Record<number, GeoBubble>}
 */
function geoBubblesFor(filter) {
  /** @type {State} */
  const state = { map: { currentMapMode: "geoimaginaryMode", filter }, ...ALL_DATES };
  return calculateGeoBubbles(data, calcGeoPoetCities(data, state, filter));
}

const cityIdByName = (/** @type {string} */ name) => {
  const city = data.cities.find(c => c.cityname === name);
  assert.ok(city, `no city named ${name}`);
  return city.cityId;
};

/**
 * The popup html for a city's bubble.
 *
 * PlacesBubble and GeoBubble both require popupHtml, so unlike the travel
 * bubbles — which are drawn without popups — there is nothing to assert here
 * beyond the city being on the map at all.
 * @param {Record<number, Bubble>} bubbles
 * @param {string} cityname
 * @returns {string}
 */
function popupFor(bubbles, cityname) {
  const bubble = bubbles[cityIdByName(cityname)];
  assert.ok(bubble, `no bubble for ${cityname}`);
  return bubble.popupHtml;
}

describe("places map: origin", () => {
  const bubbles = placesBubblesFor({ type: "relationship", num: 1 });

  test("a birthplace bubble is titled 'POETS BORN IN <city>'", () => {
    assert.match(popupFor(bubbles, "Sparta"), /POETS BORN IN SPARTA/);
  });

  test("Alcman appears under both Sparta and Sardis", () => {
    // The heart of issue #332: the sources disagree about where Alcman was
    // born, so he is currently asserted as a native of both, with no hedging.
    // When the copy changes, these two assertions are what should change.
    for (const cityname of ["Sparta", "Sardis"]) {
      const html = popupFor(bubbles, cityname);
      assert.match(html, /Alcman/, `Alcman missing from ${cityname}`);
      assert.match(html, new RegExp(`POETS BORN IN ${cityname.toUpperCase()}`));
      // Note: /possibly/i alone would match the genre "Possibly lyric".
      assert.doesNotMatch(
        html,
        /possibly born/i,
        `${cityname} already hedges Alcman's birth; issue #332 may have landed, so update this test`
      );
    }
  });

  test("a disputed birthplace names the alternatives", () => {
    // Issues #208, #218 and the second half of #257, all closed in 2015 by a
    // derived line in the CartoDB query and all silently reopened when the
    // rewrite dropped it. The wording is that line's: "See also: " and the
    // other cities, alphabetically.
    assert.match(popupFor(bubbles, "Sardis"), /See also: Sparta/);
    assert.match(popupFor(bubbles, "Sparta"), /See also: Sardis/);
    // Three sources call Tyrtaeus an Athenian, so the naive version of this
    // would repeat Athens at Miletus. Places, not testimonia.
    assert.match(popupFor(bubbles, "Miletus"), /See also: Athens, Sparta/);
    assert.match(popupFor(bubbles, "Athens"), /See also: Miletus, Sparta/);
  });

  test("an undisputed birthplace says nothing", () => {
    // 80 of the 93 poets with a birthplace. Chalcis holds only Tynnichus.
    assert.doesNotMatch(popupFor(bubbles, "Chalcis"), /See also:/);
  });

  test("popups carry dates, sources and the Greek text of the citation", () => {
    const sardis = popupFor(bubbles, "Sardis");
    assert.match(sardis, /Dates:/);
    assert.match(sardis, /Source\(s\):/);
    assert.match(sardis, /Citation:/);
    assert.match(sardis, /Greek:/);
    // Both sides are normalised defensively: the corpus is NFC (enforced by
    // data-integrity.test.js), but Greek typed into a test file can easily
    // arrive as oxia, which would render identically and never match.
    assert.ok(
      sardis.normalize("NFC").includes("Ἀλκμάν".normalize("NFC")),
      "the Suda's Greek should be quoted in the Sardis popup"
    );
  });
});

describe("places map: activity", () => {
  const bubbles = placesBubblesFor({ type: "relationship", num: 3 });

  test("a city's poets are split into natives and non-natives", () => {
    const athens = popupFor(bubbles, "Athens");
    assert.match(athens, /NATIVE LYRIC ACTIVITY IN ATHENS/);
    assert.match(athens, /NON-NATIVE LYRIC ACTIVITY IN ATHENS/);
    assert.match(athens, /NATIVE POETS/);
    assert.match(athens, /NON-NATIVE POETS/);
  });

  test("every bubble produces html and a legend", () => {
    for (const bubble of Object.values(bubbles)) {
      assert.ok(bubble.popupHtml.length > 0);
      assert.equal(bubble.legend, bubble.city.cityname);
      assert.ok(bubble.price > 0, `${bubble.city.cityname} has no bubble size`);
    }
  });
});

describe("geographical imaginary map", () => {
  const bubbles = geoBubblesFor({ type: "all", num: 1 });

  test("a bubble counts the references made to it", () => {
    const bubble = Object.values(bubbles).find(b => b.poetCities.length > 1);
    assert.ok(bubble, "expected at least one city referred to more than once");
    assert.match(bubble.popupHtml, /\d+ REFERENCES TO /);
  });

  test("poets are grouped, so one poet with three references is listed once", () => {
    for (const bubble of Object.values(bubbles)) {
      const poets = bubble.poets;
      const poetIds = poets.map(p => p.poetId);
      assert.equal(new Set(poetIds).size, poetIds.length, `${bubble.city.cityname} lists a poet twice`);
      const totalReferences = poets.reduce((n, p) => n + p.references.length, 0);
      assert.equal(totalReferences, bubble.poetCities.length);
    }
  });

  test("singular and plural are used correctly", () => {
    const single = Object.values(bubbles).find(b => b.poetCities.length === 1);
    assert.ok(single);
    assert.match(single.popupHtml, /1 REFERENCE TO /);
    assert.doesNotMatch(single.popupHtml, /1 REFERENCES TO /);
  });
});

describe("travel map", () => {
  test("an arc popup names both ends, the poets, and both citations", () => {
    // Looked up through poetsById, as the popup does. Comparing against
    // poet.poetId directly would not work: poets.csv's poetId is never parsed,
    // so a Poet holds the string "149" where its type promises a number. It goes
    // unnoticed because these ids are only ever used as object keys, which
    // coerce. Worth fixing, but not here.
    const line = data.lines.find(l => data.poetsById[l.poetId].poetDetailName === "Pindar");
    assert.ok(line, "expected Pindar to have a travel line");
    const drawnLine = {
      fromCity: line.bornCity,
      toCity: line.activeCity,
      poetLines: [line],
      dotted: false,
      color: "#fc1804",
      name: `${line.bornCity.infowindowName} -> ${line.activeCity.infowindowName}`.toUpperCase(),
      weight: 3,
      popupHtml: ""
    };
    const html = createTravelPopupHtml(data, drawnLine);
    assert.match(html, /POET\(S\)/);
    assert.match(html, /Pindar/);
    assert.match(html, /ORIGIN SOURCE/);
    assert.match(html, /ACTIVITY SOURCE/);
    assert.match(html, /THEBES/);
  });

  test("an arc out of a disputed origin names the other traditions", () => {
    // Where the "See also:" line earns the most: an arc asserts a journey out
    // of one city, and Alcman's Sardis -> Sparta is drawn beside a Sparta ->
    // Sparta that has no length and cannot be seen. Without this the travel map
    // shows only the Lydian tradition, and says nothing of the Laconian one.
    const line = data.lines.find(l => l.bornCity.cityname === "Sardis" && l.activeCity.cityname === "Sparta");
    assert.ok(line, "expected Alcman's Sardis -> Sparta line");
    const html = createTravelPopupHtml(data, {
      fromCity: line.bornCity,
      toCity: line.activeCity,
      poetLines: [line],
      dotted: false,
      color: "#fc1804",
      name: "SARDIS -> SPARTA",
      weight: 3
    });
    const origin = html.slice(html.indexOf("ORIGIN SOURCE"), html.indexOf("ACTIVITY SOURCE"));
    assert.match(origin, /See also: Sparta/);
    // Only the origin end. The other end is a place of activity, which has no
    // alternatives to offer.
    assert.doesNotMatch(html.slice(html.indexOf("ACTIVITY SOURCE")), /See also:/);
  });
});

describe("popup html is well formed enough to render", () => {
  test("no popup leaks 'undefined' or 'NaN' into the page", () => {
    /** @type {[string, Record<number, Bubble>][]} */
    const VIEWS = [
      ["places/origin", placesBubblesFor({ type: "relationship", num: 1 })],
      ["places/activity", placesBubblesFor({ type: "relationship", num: 3 })],
      ["places/genre", placesBubblesFor({ type: "genre", num: 2 })],
      ["geographical imaginary", geoBubblesFor({ type: "all", num: 1 })]
    ];
    for (const [view, bubbles] of VIEWS) {
      for (const bubble of Object.values(bubbles)) {
        const html = bubble.popupHtml;
        const cityname = bubble.city.cityname;
        assert.doesNotMatch(html, /undefined/, `${view} popup for ${cityname} contains "undefined"`);
        assert.doesNotMatch(html, /NaN/, `${view} popup for ${cityname} contains "NaN"`);
      }
    }
  });
});
