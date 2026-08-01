// Rendering tests for the popups, driven through the real filter pipeline.
//
// calcPoetCities() and calculateBubbles() are pure, so Node can build the exact
// bubbles the browser builds and assert on the html they produce. These are the
// tests to lean on when changing popup copy — notably issue #332, which will
// change how a poet with several reported birthplaces is described.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { loadInitializedData } from "./helpers/loadData.js";
import { calcPoetCities } from "../js/renderMap/calcPoetCities.js";
import { calculateBubbles } from "../js/renderMap/calcBubbles.js";
import { createTravelPopupHtml } from "../js/popups/travelPopups.js";

const { data } = loadInitializedData();

const ALL_DATES = { minDate: -800, maxDate: -400 };

/**
 * @param {State["currentMapMode"]} currentMapMode
 * @param {string} selectedId
 * @returns {Record<number, Bubble>}
 */
function bubblesFor(currentMapMode, selectedId) {
  /** @type {State} */
  const state = { currentMapMode, selectedId, ...ALL_DATES };
  return calculateBubbles(state, data, calcPoetCities(data, state));
}

const cityIdByName = (/** @type {string} */ name) => {
  const city = data.cities.find(c => c.cityname === name);
  assert.ok(city, `no city named ${name}`);
  return city.cityId;
};

/**
 * The popup html for a city's bubble, asserting both exist. calculateBubbles()
 * always sets popupHtml for the modes these tests exercise, but the type allows
 * for travel mode, where bubbles are drawn without popups.
 * @param {Record<number, Bubble>} bubbles
 * @param {string} cityname
 * @returns {string}
 */
function popupFor(bubbles, cityname) {
  const bubble = bubbles[cityIdByName(cityname)];
  assert.ok(bubble, `no bubble for ${cityname}`);
  assert.ok(bubble.popupHtml, `no popup html for ${cityname}`);
  return bubble.popupHtml;
}

/**
 * As popupFor, for a bubble already in hand.
 * @param {Bubble} bubble
 * @returns {string}
 */
function popupOf(bubble) {
  assert.ok(bubble.popupHtml, `no popup html for ${bubble.city.cityname}`);
  return bubble.popupHtml;
}

/**
 * The grouped poets on a geographical-imaginary bubble, asserting they exist.
 * @param {Bubble} bubble
 * @returns {GeoBubblePoet[]}
 */
function poetsOf(bubble) {
  assert.ok(bubble.poets, `no grouped poets for ${bubble.city.cityname}`);
  return bubble.poets;
}

describe("places map: origin", () => {
  const bubbles = bubblesFor("placesMode", "relationship_1");

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
  const bubbles = bubblesFor("placesMode", "relationship_3");

  test("a city's poets are split into natives and non-natives", () => {
    const athens = popupFor(bubbles, "Athens");
    assert.match(athens, /NATIVE LYRIC ACTIVITY IN ATHENS/);
    assert.match(athens, /NON-NATIVE LYRIC ACTIVITY IN ATHENS/);
    assert.match(athens, /NATIVE POETS/);
    assert.match(athens, /NON-NATIVE POETS/);
  });

  test("every bubble produces html and a legend", () => {
    for (const bubble of Object.values(bubbles)) {
      assert.ok(popupOf(bubble).length > 0);
      assert.equal(bubble.legend, bubble.city.cityname);
      assert.ok(bubble.price > 0, `${bubble.city.cityname} has no bubble size`);
    }
  });
});

describe("geographical imaginary map", () => {
  const bubbles = bubblesFor("geoimaginaryMode", "all_1");

  test("a bubble counts the references made to it", () => {
    const bubble = Object.values(bubbles).find(b => b.poetCities.length > 1);
    assert.ok(bubble, "expected at least one city referred to more than once");
    assert.match(popupOf(bubble), /\d+ REFERENCES TO /);
  });

  test("poets are grouped, so one poet with three references is listed once", () => {
    for (const bubble of Object.values(bubbles)) {
      const poets = poetsOf(bubble);
      const poetIds = poets.map(p => p.poetId);
      assert.equal(new Set(poetIds).size, poetIds.length, `${bubble.city.cityname} lists a poet twice`);
      const totalReferences = poets.reduce((n, p) => n + p.references.length, 0);
      assert.equal(totalReferences, bubble.poetCities.length);
    }
  });

  test("singular and plural are used correctly", () => {
    const single = Object.values(bubbles).find(b => b.poetCities.length === 1);
    assert.ok(single);
    assert.match(popupOf(single), /1 REFERENCE TO /);
    assert.doesNotMatch(popupOf(single), /1 REFERENCES TO /);
  });
});

describe("travel map", () => {
  test("an arc popup names both ends, the poets, and both citations", () => {
    const line = data.lines.find(l => l.poetDetailName === "Pindar");
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
});

describe("popup html is well formed enough to render", () => {
  test("no popup leaks 'undefined' or 'NaN' into the page", () => {
    /** @type {[State["currentMapMode"], string][]} */
    const VIEWS = [
      ["placesMode", "relationship_1"],
      ["placesMode", "relationship_3"],
      ["geoimaginaryMode", "all_1"]
    ];
    for (const [mode, selectedId] of VIEWS) {
      for (const bubble of Object.values(bubblesFor(mode, selectedId))) {
        const html = popupOf(bubble);
        const cityname = bubble.city.cityname;
        assert.doesNotMatch(html, /undefined/, `${mode}/${selectedId} popup for ${cityname} contains "undefined"`);
        assert.doesNotMatch(html, /NaN/, `${mode}/${selectedId} popup for ${cityname} contains "NaN"`);
      }
    }
  });
});
