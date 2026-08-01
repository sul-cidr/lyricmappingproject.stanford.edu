// Behaviour of the travel map's arcs, driven through the real pipeline.
//
// filterLines() and calculateLines() are pure, so Node can build the exact arcs
// the browser draws and assert on how they merge, what colour they take and how
// thick they are. As in popups.test.js, nothing is stubbed: the CSVs go in and
// the arcs come out.
//
// Colour and weight had no coverage at all before this file, which made them the
// riskiest part of any change to lines.js — both are plainly visible on the map
// and neither was asserted anywhere.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { loadInitializedData } from "./helpers/loadData.js";
import { filterLines, calculateLines } from "../js/renderMap/lines.js";
import { getDateFilterFn } from "../js/renderMap/calcCommon.js";
import { TRAVEL_RED, TRAVEL_PURPLE, TRAVEL_YELLOW } from "../js/constants/colors.js";

const { data } = loadInitializedData();

/** The whole slider range, i.e. what the map shows before anything is dragged. */
const ALL_DATES = { minDate: -800, maxDate: -400 };

/** governments.csv ids, as the political system control bar offers them. */
const DEMOCRACY = 3;
const TYRANNY = 2;

/**
 * The arcs the travel map draws for one control bar selection, assembled the
 * same way calculateAndDrawLines() assembles them.
 * @param {TravelFilterType} type
 * @param {number} num
 * @returns {DrawnLine[]}
 */
function arcsFor(type, num) {
  /** @type {State} */
  const state = { currentMapMode: "travelMode", selectedId: `${type}_${num}`, ...ALL_DATES };
  const poetLines = filterLines(data, type, num).filter(getDateFilterFn(data, state));
  return Object.values(calculateLines(data, type, num, poetLines));
}

/**
 * @param {DrawnLine[]} arcs
 * @param {string} name e.g. "THEBES -> ATHENS"
 * @returns {DrawnLine}
 */
function arcNamed(arcs, name) {
  const matching = arcs.filter(arc => arc.name === name);
  assert.equal(matching.length, 1, `expected exactly one "${name}" arc, found ${matching.length}`);
  return matching[0];
}

const cityIdByName = (/** @type {string} */ cityname) => {
  const city = data.cities.find(c => c.cityname === cityname);
  assert.ok(city, `no city named ${cityname}`);
  return city.cityId;
};

describe("arcs merge the poets who made the same journey", () => {
  const arcs = arcsFor("all", 1);

  test("three poets going from Thebes to Athens draw one arc, not three", () => {
    const arc = arcNamed(arcs, "THEBES -> ATHENS");
    assert.deepEqual(arc.poetLines.map(line => line.poetDetailName).sort(), ["Khairis", "Pindar", "Pronomus"]);
  });

  test("one poet's uncertain journey dots the whole arc", () => {
    // Bacchylides' line to Athens is marked dotted in poets_cities.csv and
    // Simonides' is not. They share an arc, so the arc is drawn dotted: the
    // hedge belongs to one of the two, but the map cannot say so.
    const arc = arcNamed(arcs, "IOULIS (CEOS) -> ATHENS");
    assert.deepEqual(arc.poetLines.map(line => `${line.poetDetailName}:${line.dotted}`).sort(), [
      "Bacchylides:true",
      "Simonides:false"
    ]);
    assert.ok(arc.dotted);
  });

  test("an arc no one hedged is drawn solid", () => {
    assert.equal(arcNamed(arcs, "THEBES -> ATHENS").dotted, false);
  });

  test("an arc is named from origin to destination", () => {
    for (const arc of arcs) {
      assert.equal(arc.name, `${arc.fromCity.infowindowName} -> ${arc.toCity.infowindowName}`.toUpperCase());
    }
  });

  test("the whole slider range drops nothing, so every line above reaches the map", () => {
    // The other tests here read as claims about the corpus rather than about the
    // date filter, which is only true while the full range keeps everything.
    const drawn = arcs.reduce((count, arc) => count + arc.poetLines.length, 0);
    assert.equal(drawn, data.lines.length);
  });
});

describe("arc colour", () => {
  test("nothing is picked out until something is selected", () => {
    for (const arc of arcsFor("all", 1)) assert.equal(arc.color, TRAVEL_RED);
  });

  test("selecting a city marks the journeys out of it, not the ones into it", () => {
    const athens = cityIdByName("Athens");
    const arcs = arcsFor("destination", athens);
    for (const arc of arcs) {
      const expected = arc.fromCity.cityId === athens ? TRAVEL_PURPLE : TRAVEL_RED;
      assert.equal(arc.color, expected, `${arc.name} is the wrong way round for a journey out of Athens`);
    }
    // Both directions are on the map, so the loop above is actually deciding.
    assert.ok(
      arcs.some(arc => arc.color === TRAVEL_PURPLE),
      "no arc leaves Athens"
    );
    assert.ok(
      arcs.some(arc => arc.color === TRAVEL_RED),
      "no arc arrives at Athens"
    );
  });

  test("selecting a small region marks the journeys out of it", () => {
    const attica = data.citiesById[cityIdByName("Athens")].regionId;
    const arcs = arcsFor("smallregion", attica);
    for (const arc of arcs) {
      const expected = arc.fromCity.regionId === attica ? TRAVEL_PURPLE : TRAVEL_RED;
      assert.equal(arc.color, expected, `${arc.name} is the wrong way round for a journey out of Attica`);
    }
    assert.ok(arcs.some(arc => arc.color === TRAVEL_PURPLE) && arcs.some(arc => arc.color === TRAVEL_RED));
  });

  test("under a political system, yellow stays within it, purple leaves it, red arrives in it", () => {
    const arcs = arcsFor("gov", DEMOCRACY);
    assert.equal(arcNamed(arcs, "ATHENS -> SALAMIS").color, TRAVEL_YELLOW, "democracy to democracy");
    assert.equal(arcNamed(arcs, "ATHENS -> DELOS").color, TRAVEL_PURPLE, "out of a democracy");
    assert.equal(arcNamed(arcs, "THEBES -> ATHENS").color, TRAVEL_RED, "into a democracy");
  });

  test("the same three cases under tyranny", () => {
    const arcs = arcsFor("gov", TYRANNY);
    assert.equal(arcNamed(arcs, "MYTILENE -> LEUCAS").color, TRAVEL_YELLOW, "tyranny to tyranny");
    assert.equal(arcNamed(arcs, "CHIOS -> ATHENS").color, TRAVEL_PURPLE, "out of a tyranny");
    assert.equal(arcNamed(arcs, "THEBES -> SYRACUSE").color, TRAVEL_RED, "into a tyranny");
  });
});

describe("arc weight", () => {
  test("an arc is as thick as the number of poets who travelled it", () => {
    for (const arc of arcsFor("all", 1)) assert.equal(arc.weight, arc.poetLines.length);
  });

  test("the poet, city and small region filters draw thicker, so a lone journey still reads", () => {
    // Those three usually leave only a handful of arcs on the map, where a
    // weight of 1 would be all but invisible.
    /** @type {[TravelFilterType, number][]} */
    const SPARSE = [
      ["destination", cityIdByName("Athens")],
      ["smallregion", data.citiesById[cityIdByName("Athens")].regionId],
      ["poet", data.travelPoets[0].id]
    ];
    for (const [type, num] of SPARSE) {
      const arcs = arcsFor(type, num);
      assert.ok(arcs.length > 0, `${type}_${num} draws nothing`);
      for (const arc of arcs) assert.equal(arc.weight, 2 * arc.poetLines.length + 1, `${type}: ${arc.name}`);
    }
  });

  test("Thebes to Athens carries three poets, so it is drawn at 3 and, picked out, at 7", () => {
    assert.equal(arcNamed(arcsFor("all", 1), "THEBES -> ATHENS").weight, 3);
    assert.equal(arcNamed(arcsFor("destination", cityIdByName("Athens")), "THEBES -> ATHENS").weight, 7);
  });
});

describe("arc popups", () => {
  test("the political system filter reports regimes, every other filter reports sources", () => {
    const gov = arcsFor("gov", DEMOCRACY)[0].popupHtml;
    assert.match(gov, /Regime \(data from Hansen and Nielsen\)/);
    assert.doesNotMatch(gov, /Source\(s\)/);

    const all = arcsFor("all", 1)[0].popupHtml;
    assert.match(all, /Source\(s\)/);
    assert.doesNotMatch(all, /Regime/);
  });

  test("every arc gets a popup citing both ends of the journey", () => {
    for (const arc of arcsFor("all", 1)) {
      assert.match(arc.popupHtml, /ORIGIN SOURCE/, `${arc.name} popup has no origin`);
      assert.match(arc.popupHtml, /ACTIVITY SOURCE/, `${arc.name} popup has no destination`);
      assert.doesNotMatch(arc.popupHtml, /undefined/, `${arc.name} popup contains "undefined"`);
      assert.doesNotMatch(arc.popupHtml, /NaN/, `${arc.name} popup contains "NaN"`);
    }
  });
});
