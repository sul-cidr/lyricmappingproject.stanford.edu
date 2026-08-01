// Behaviour of js/calcData/data.js, run against the real CSVs.
//
// initializeData() is pure JavaScript with no browser dependencies, so Node can
// run the exact pipeline the browser runs and assert on what comes out.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { loadInitializedData } from "./helpers/loadData.js";
import { sortAlphabetically } from "../js/calcData/data.js";
import { PLACES_FILTER_TYPES, GEO_FILTER_TYPES, TRAVEL_FILTER_TYPES } from "../js/calcData/getters.js";
import { createPlacesInterfaceHtml } from "../js/interface/placesInterface.js";
import { createTravelInterfaceHtml } from "../js/interface/travelInterface.js";
import { createGeoImaginaryInterfaceHtml } from "../js/interface/geoImaginaryInterface.js";

const { data, alerts, logs } = loadInitializedData();

const poetIdByName = (/** @type {string} */ name) => {
  const poet = data.poets.find(p => p.poetname === name);
  assert.ok(poet, `no poet named ${name}`);
  return poet.poetId;
};

describe("initializeData runs clean", () => {
  test("no alerts", () => {
    assert.deepEqual(alerts, [], "initializeData alerted, which means a poet lookup failed");
  });

  test("no console warnings about unresolved ids", () => {
    assert.deepEqual(logs, [], `initializeData logged:\n  ${logs.join("\n  ")}`);
  });
});

describe("hydration", () => {
  test("ids and coordinates become numbers", () => {
    for (const city of data.cities) {
      assert.equal(typeof city.cityId, "number", `${city.cityname} has a non-numeric cityId`);
      assert.equal(typeof city.lat, "number", `${city.cityname} has a non-numeric lat`);
      assert.equal(typeof city.long, "number", `${city.cityname} has a non-numeric long`);
    }
    for (const pc of data.poetCities) {
      assert.equal(typeof pc.poetId, "number");
      assert.equal(typeof pc.cityId, "number");
    }
  });

  test("cities with no coordinates hydrate to NaN, and are skipped when drawing", () => {
    // parseFloat("") is NaN, and drawBubbles() tests `if (bubble.city.lat && ...)`,
    // so these two cities are simply never drawn. Asserted explicitly because
    // `typeof NaN === "number"` makes them invisible to the check above.
    const unplaced = data.cities.filter(city => Number.isNaN(city.lat) || Number.isNaN(city.long));
    assert.deepEqual(unplaced.map(city => city.cityname).sort(), ["Onogloi", "Stathmi"]);
    for (const city of unplaced) {
      assert.ok(Number.isNaN(city.lat) && Number.isNaN(city.long), "one coordinate without the other");
    }
  });

  test("dates become negative years, so BCE sorts naturally", () => {
    for (const date of data.dates) {
      assert.ok(date.date < 0, `date ${date.date} should be negative (BCE)`);
    }
    assert.ok(data.dates.every(d => d.date >= -900 && d.date <= -300));
  });

  test("every lookup table is populated", () => {
    /** @type {(keyof Data)[]} */
    const LOOKUP_TABLES = [
      "citiesById",
      "poetsById",
      "regionsById",
      "genresByPoetId",
      "genresByGenreId",
      "govsByCityId",
      "govsById",
      "datesByPoetId",
      "linesByPoetId",
      "linesByBornCityId",
      "linesByActiveCityId"
    ];
    for (const key of LOOKUP_TABLES) {
      assert.ok(Object.keys(data[key]).length > 0, `${key} is empty`);
    }
  });

  test("every row is primed with its poet's display data", () => {
    for (const pc of [...data.poetCities, ...data.geopoetCities]) {
      assert.equal(typeof pc.poetDetailName, "string");
      assert.ok(pc.poetDetailName.length > 0, `row for poetId ${pc.poetId} has no poetDetailName`);
      assert.equal(typeof pc.poetDates, "string");
    }
  });
});

describe("date filtering depends on every mapped poet having dates", () => {
  // getDateFilterFn() drops any poet with no minDate/maxDate from the map
  // entirely. Nothing in the code enforces that they exist, so it is asserted
  // here instead.
  test("every poet on the map has a min and max date", () => {
    const mapped = new Set([...data.poetCities, ...data.geopoetCities].map(pc => pc.poetId));
    for (const poetId of mapped) {
      const poet = data.poetsById[poetId];
      assert.ok(poet, `poetId ${poetId} is on the map but not in poets.csv`);
      assert.equal(typeof poet.minDate, "number", `${poet.poetname} has no minDate, so is invisible on the map`);
      assert.equal(typeof poet.maxDate, "number", `${poet.poetname} has no maxDate, so is invisible on the map`);
      assert.ok(poet.minDate <= poet.maxDate, `${poet.poetname} has minDate after maxDate`);
    }
  });
});

describe("travel lines", () => {
  test("one line per (birthplace, place of activity) pair", () => {
    const byPoet = new Map();
    for (const pc of data.poetCities) {
      if (!byPoet.has(pc.poetId)) byPoet.set(pc.poetId, { born: 0, active: 0 });
      const counts = byPoet.get(pc.poetId);
      if (pc.relationshipId === 1) counts.born++;
      else if (pc.relationshipId === 2 || pc.relationshipId === 3) counts.active++;
    }
    let expected = 0;
    for (const { born, active } of byPoet.values()) expected += born * active;
    assert.equal(data.lines.length, expected);
  });

  test("a poet with two attested birthplaces gets a line from each", () => {
    // Alcman is reported as a Spartan (Suda A 1290) and as a Lydian from Sardis
    // (Crates); the map shows both, which is what issue #332 is about.
    const alcman = poetIdByName("Alcman");
    const lines = data.linesByPoetId[alcman];
    const journeys = lines.map(l => `${l.bornCity.cityname} -> ${l.activeCity.cityname}`).sort();
    assert.deepEqual(journeys, ["Sardis -> Sparta", "Sparta -> Sparta"]);
  });

  test("every line resolves both its cities and carries its citations", () => {
    for (const line of data.lines) {
      assert.ok(line.bornCity, `line for poetId ${line.poetId} has no born city`);
      assert.ok(line.activeCity, `line for poetId ${line.poetId} has no active city`);
      assert.equal(line.bornPc.relationshipId, 1);
      assert.ok([2, 3].includes(line.activePc.relationshipId));
    }
  });

  test("poets with a birthplace but nowhere to go are listed as unknown travel", () => {
    assert.ok(data.poetsWithUnknownTravel.length > 0);
    const travelling = new Set(data.lines.map(l => l.poetId));
    for (const { id: poetId } of data.poetsWithUnknownTravel) {
      assert.ok(!travelling.has(poetId), `poetId ${poetId} both travels and has unknown travel`);
    }
  });

  test("government ids are unpacked for mixed regimes", () => {
    // convertMixedGovIds: 9 = oligarchy/tyranny, so it implies 1 and 2 as well.
    const mixed = data.lines.filter(l => l.bornGovIds.includes(9));
    for (const line of mixed) {
      assert.ok(
        line.bornGovIds.includes(1) && line.bornGovIds.includes(2),
        "a line born under oligarchy/tyranny should match both oligarchy and tyranny filters"
      );
    }
  });
});

describe("control bar contents", () => {
  test("Pindar and Bacchylides are excluded from the geographical imaginary", () => {
    // Their geographical imaginary is a pilot of one poem each (Olympian 1 and
    // Ode 17), so they are deliberately kept out of the poet list. See issue #326.
    const names = data.geoImaginaryPoets.map(poet => poet.name);
    assert.ok(!names.includes("Pindar"));
    assert.ok(!names.includes("Bacchylides"));
  });

  test("Sappho or Alcaeus sorts last, after the individually named poets", () => {
    const last = data.geoImaginaryPoets[data.geoImaginaryPoets.length - 1];
    assert.match(last.name, /Sappho/);
  });

  test("every control bar list is sorted and non-empty", () => {
    for (const key of /** @type {("travelPoets" | "travelCities" | "poetsWithUnknownTravel" | "regionsForInterface")[]} */
    (["travelPoets", "travelCities", "poetsWithUnknownTravel", "regionsForInterface"])) {
      const list = data[key];
      assert.ok(list.length > 0, `${key} is empty`);
      const names = list.map(option => option.name);
      assert.deepEqual(names, [...names].sort(sortAlphabetically), `${key} is not sorted`);
    }
  });

  test("the geographical imaginary poets are sorted apart from Sappho/Alcaeus at the end", () => {
    const names = data.geoImaginaryPoets.map(poet => poet.name);
    assert.ok(names.length > 0);
    const allButLast = names.slice(0, -1);
    assert.deepEqual(allButLast, [...allButLast].sort(sortAlphabetically));
  });

  test("every control bar entry points at something real", () => {
    for (const { id: poetId } of [...data.travelPoets, ...data.geoImaginaryPoets, ...data.poetsWithUnknownTravel]) {
      assert.ok(data.poetsById[poetId], `control bar offers unknown poetId ${poetId}`);
    }
    for (const { id: cityId } of data.travelCities) {
      assert.ok(data.citiesById[cityId], `control bar offers unknown cityId ${cityId}`);
    }
  });
});

describe("sortAlphabetically", () => {
  test("sorts letters normally", () => {
    assert.deepEqual(["Sappho", "Alcman", "Pindar"].sort(sortAlphabetically), ["Alcman", "Pindar", "Sappho"]);
  });

  test("pushes names that do not start with a letter to the end", () => {
    assert.deepEqual(["Ἀλκμάν", "Sappho", "[Anon.]"].sort(sortAlphabetically)[0], "Sappho");
  });
});

// ---------------------------------------------------------------------------
// KNOWN BUGS in the derived data. As in data-integrity.test.js, these assert
// what is currently WRONG and are named "BUG:" accordingly. A failure here is
// the signal to delete the test, not to restore the behaviour.
// ---------------------------------------------------------------------------

describe("known bugs: derived travel lines", () => {
  test("BUG: a poet born and active in the same city gets a zero-length line", () => {
    // createLines() takes the cartesian product of birthplaces and places of
    // activity without excluding the case where the two are the same city.
    const degenerate = data.lines.filter(l => l.bornCityId === l.activeCityId);
    assert.deepEqual(degenerate.map(l => `${l.poetDetailName}: ${l.bornCity.cityname}`).sort(), [
      "Alcman: Sparta",
      "Corinna: Thebes",
      "Tyrtaeus: Sparta"
    ]);

    // L.geodesic draws nothing for a zero-length pair, so these lines are
    // invisible. drawLines() still adds a transparent click target of
    // weight * 20 over the city, tooltipped e.g. "SPARTA -> SPARTA".
    //
    // The fix is one line in createLines():
    //   if (bornPc.cityId === activePc.cityId) continue;
    assert.equal(degenerate.length, 3);
  });

  test("BUG: for disputed origins, it is the native tradition that renders invisibly", () => {
    // All three poets above have several reported birthplaces, one of which is
    // the city they were active in. That is precisely the line that vanishes,
    // so the map draws the foreign-origin traditions and silently drops the
    // native one. This is the travel-map half of issue #332, and it is worse
    // than the popup wording: the omission cannot be seen at all.
    /** @type {[string, string, string[]][]} */
    const CASES = [
      ["Alcman", "Sparta", ["Sardis"]],
      ["Corinna", "Thebes", ["Tanagra"]]
    ];
    for (const [name, invisible, drawn] of CASES) {
      const lines = data.linesByPoetId[poetIdByName(name)];
      const visible = lines.filter(l => l.bornCityId !== l.activeCityId);
      assert.deepEqual(
        visible.map(l => l.bornCity.cityname).sort(),
        drawn,
        `${name}'s only drawn origin is the one the sources dispute`
      );
      assert.ok(lines.some(l => l.bornCity.cityname === invisible && l.bornCityId === l.activeCityId));
    }

    // Tyrtaeus is affected too, but has a second place of activity (Messenia),
    // so his Spartan origin still reaches the map via Sparta -> Messenia.
    const tyrtaeus = data.linesByPoetId[poetIdByName("Tyrtaeus")];
    assert.ok(tyrtaeus.some(l => l.bornCity.cityname === "Sparta" && l.activeCity.cityname !== "Sparta"));
  });
});

// ---------------------------------------------------------------------------
// The control bar is HTML strings, and a radio button's id is the only thing
// tying a click back to a filter. The types stop a prefix being misspelt; these
// tests tie each map's declared filter union to what its builder actually emits,
// which the types cannot see because all three builders take MapFilterType.
//
// Asserted as an equality rather than a subset, in both directions at once: a
// map that offers a filter it cannot handle fails, and so does a map that
// declares a filter it never offers — which is the dead branch that used to
// need a throw in createPlacesModeTitle().
// ---------------------------------------------------------------------------

describe("each control bar offers exactly the filters its map declares", () => {
  /** Every `${prefix}_${num}` id in a block of control bar html. */
  const idsIn = (/** @type {string} */ html) => [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);

  const prefixesIn = (/** @type {string} */ html) => [...new Set(idsIn(html).map(id => id.split("_")[0]))].sort();

  test("places: ORIGIN and ACTIVITY, the poets, and the genres", () => {
    assert.deepEqual(prefixesIn(createPlacesInterfaceHtml(data)), [...PLACES_FILTER_TYPES].sort());
  });

  test("geographical imaginary: ALL REFERENCES and the poets, and nothing else", () => {
    assert.deepEqual(prefixesIn(createGeoImaginaryInterfaceHtml(data)), [...GEO_FILTER_TYPES].sort());
  });

  test("travel: all six", () => {
    assert.deepEqual(prefixesIn(createTravelInterfaceHtml(data)), [...TRAVEL_FILTER_TYPES].sort());
  });

  test("the two bubble maps really do offer different filters", () => {
    // The point of splitting PlacesFilterType from GeoFilterType. If these ever
    // coincide the split has stopped earning its keep.
    const places = prefixesIn(createPlacesInterfaceHtml(data));
    const geo = prefixesIn(createGeoImaginaryInterfaceHtml(data));
    assert.notDeepEqual(places, geo);
    assert.ok(!places.includes("all"), "the places map has no ALL button");
    assert.ok(!geo.includes("genre"), "the geographical imaginary map has no genre buttons");
  });

  test("every id parses back to the filter and number it was built from", () => {
    const html =
      createPlacesInterfaceHtml(data) + createTravelInterfaceHtml(data) + createGeoImaginaryInterfaceHtml(data);
    for (const id of idsIn(html)) {
      const [prefix, num] = id.split("_");
      assert.ok(prefix.length > 0, `id "${id}" has no filter prefix`);
      assert.ok(Number.isFinite(parseInt(num)), `id "${id}" has no numeric id`);
    }
  });

  test("the default selectedId of each mode is one that mode can handle", () => {
    // updateMapMode() sets these; they are what the map renders on first paint.
    assert.ok(PLACES_FILTER_TYPES.includes(/** @type {PlacesFilterType} */ ("relationship")));
    assert.ok(GEO_FILTER_TYPES.includes(/** @type {GeoFilterType} */ ("all")));
    assert.ok(TRAVEL_FILTER_TYPES.includes(/** @type {TravelFilterType} */ ("all")));
  });
});
