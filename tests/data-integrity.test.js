// Data-integrity checks over dataFiles/*.csv.
//
// The CSVs are hand-edited in spreadsheets by several people over many years,
// and most of the bugs this project has hit (dangling ids, missing citations,
// rows that stopped matching their poet) are data bugs rather than code bugs.
// These tests are the guard rail for that.
//
// The data currently violates some of these rules. Rather than weaken the rule,
// the offending rows are listed in the exception sets below, so that any NEW
// violation still fails the build.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { loadRawCsvs } from "./helpers/loadData.js";

const raw = loadRawCsvs();
const id = (/** @type {string} */ value) => parseInt(value);
const filled = (/** @type {string | undefined} */ value) => String(value ?? "").trim() !== "";

const cityIds = new Set(raw.cities.map(c => id(c.cityId)));
const poetIds = new Set(raw.poets.map(p => id(p.poetId)));
const governmentIds = new Set(raw.governments.map(g => id(g.governmentId)));
const regionIds = new Set(raw.regions.map(r => id(r.regionId)));
const bigRegionIds = new Set(raw.bigRegions.map(r => id(r.regionId)));
const cityNameById = new Map(raw.cities.map(c => [id(c.cityId), c.cityname]));

/** The join tables that carry a cityname label. */
/** @type {PoetCityCsv[]} */
const POET_CITY_CSVS = ["poetCities", "geopoetCities"];

/** The cited tables with no known incomplete citations. */
/** @type {CitedCsv[]} */
const CLEAN_CITED_CSVS = ["geopoetCities", "genres"];

// ---------------------------------------------------------------------------
// Exceptions for data that is currently broken. See "known data bugs" at the
// bottom of this file for what each one actually is.
// ---------------------------------------------------------------------------

/** Geographical-imaginary rows pointing at cityIds absent from cities.csv. */
const KNOWN_UNMAPPED_GEO_CITY_IDS = new Set([
  154, // Dryopis (Doris) - Stesichorus 222, Telestes fr. 806
  156, // Annichorum - Alcman fr. 150
  165, // Denthiades - Alcman fr. 92(d)
  170, // Five Crests - Alcman fr. 92(c)
  172, // Ibe - Alcman fr. 1.59
  173, // Nyrsylas - Alcman fr. 173
  217, // Phthia - Cinesias fr. 775
  221, // Sintia - Anacreon fr. eleg. 3.2
  227, // Corax - Hipponax 2.1
  228, // Cylicrania - Hermippus 4
  238, // Mytalis - Hipponax 42.4
  239 // Phlyesia - Hipponax 47.2
]);

/** genres.csv rows whose poetId is not in poets.csv. */
const KNOWN_ORPHAN_GENRE_POET_IDS = new Set([14, 31, 33, 113]);

/**
 * Cities no citation points at, so no map draws them.
 *
 * Each still has nine city_politics rows, which is why they are here rather
 * than in removed_data.txt with the other eight: deleting the city means
 * deleting that regime history too, and Attica shows the rows can outlive the
 * citation by accident — the geographical imaginary row that referenced it was
 * archived in December 2023 and the city was left behind. Whether the politics
 * is worth keeping without a poet attached is an editorial call.
 */
const KNOWN_UNREFERENCED_CITY_IDS = new Set([
  24, // Megalopolis
  25, // Stageira
  67, // Siris
  86, // Kynoskephalai
  198 // Attica (region), orphaned by the Aristotle archiving
]);

/**
 * Rows whose cityname label does not match the cities.csv entry they point at,
 * as [cityId, label]. Most are harmless spelling variants (Aegina/Aigina,
 * Ceos/Ioulis). The three marked BUG are different places entirely.
 */
const ACCEPTED_CITY_LABEL_VARIANTS = [
  [17, "Megara (Attic)"],
  [26, "Soli"],
  [33, "Macedon"],
  [46, "Ceos"],
  [74, "Heracleia"],
  [76, "Thespia"],
  [85, "Persepolis"],
  [89, "Aegina"],
  [91, "Nile"],
  [94, "Tempe"], // the sanctuary of Poseidon Petraios stands in the Tempe valley
  [100, "Olympus"],
  [102, "Maeonia"], // the older name for Lydia
  [106, "Cyrpus"], // typo for Cyprus, but points at the right city
  [118, "Ceteia"],
  [131, "Issedones (Scythia)"],
  [134, "Phocis"], // BUG: plotted on Aetolia (38.56N 21.67E). Stesichorus 222 names both.
  [140, "Cholchis"],
  [149, "Larissa"],
  [162, "Cerbesians"],
  [176, "Pityussae (Balearic Islands)"],
  [179, "Therapne"],
  [206, "Euripus"],
  [216, "Parnassus"],
  [219, "Mt. Ptoïon"],
  [254, "Camarina"], // BUG: plotted on Erythrae in Ionia. Camarina is in Sicily.
  [254, "Ionian Erythrae"],
  [255, "Cyrene"], // BUG: plotted on Phocaea in Ionia. Cyrene is in Libya.
  [257, "Orchomenus"]
];
const acceptedCityLabels = new Set(ACCEPTED_CITY_LABEL_VARIANTS.map(([cityId, label]) => `${cityId}|${label}`));

/** poets_cities rows carrying a citation but no translation or translator. */
const KNOWN_INCOMPLETE_CITATION_COUNT = 18;

/**
 * The mapped world runs from Ethiopia in the south to Scythia in the north, and
 * from Tartessus and Erytheia beyond the Pillars of Heracles in the west
 * (Stesichorus' Geryoneis) to Ecbatana in the east.
 */
const WORLD_BOUNDS = { minLat: 5, maxLat: 50, minLong: -10, maxLong: 55 };

// ---------------------------------------------------------------------------

describe("primary keys", () => {
  /** @type {[keyof RawCsvs, string][]} */
  const KEYED_FILES = [
    ["cities", "cityId"],
    ["poets", "poetId"],
    ["governments", "governmentId"]
  ];
  for (const [file, key] of KEYED_FILES) {
    test(`${file}.csv has unique ${key}`, () => {
      const seen = new Map();
      for (const row of raw[file]) {
        const value = id(/** @type {Record<string, string>} */ (/** @type {unknown} */ (row))[key]);
        assert.ok(!seen.has(value), `${key} ${value} appears twice in ${file}.csv`);
        seen.set(value, row);
      }
    });
  }

  test("regions.csv has unique regionId", () => {
    const seen = new Set();
    for (const region of raw.regions) {
      assert.ok(!seen.has(id(region.regionId)), `duplicate regionId ${region.regionId}`);
      seen.add(id(region.regionId));
    }
  });
});

describe("referential integrity", () => {
  test("every poets_cities row resolves to a poet", () => {
    for (const row of raw.poetCities) {
      assert.ok(poetIds.has(id(row.poetId)), `${row.poetname} has unknown poetId ${row.poetId}`);
    }
  });

  test("every poets_cities row resolves to a city", () => {
    for (const row of raw.poetCities) {
      if (!filled(row.cityId)) continue; // blank means the place was never mapped
      assert.ok(cityIds.has(id(row.cityId)), `${row.poetname} -> ${row.cityname} has unknown cityId ${row.cityId}`);
    }
  });

  test("every geographical imaginary row resolves to a poet", () => {
    for (const row of raw.geopoetCities) {
      assert.ok(poetIds.has(id(row.poetId)), `${row.poetname} has unknown poetId ${row.poetId}`);
    }
  });

  test("no NEW geographical imaginary row points at a missing city", () => {
    for (const row of raw.geopoetCities) {
      if (!filled(row.cityId)) continue;
      if (KNOWN_UNMAPPED_GEO_CITY_IDS.has(id(row.cityId))) continue;
      assert.ok(
        cityIds.has(id(row.cityId)),
        `${row.poetname} -> ${row.cityname} (cityId ${row.cityId}) is not in cities.csv, ` +
          `so this citation will not appear on the map`
      );
    }
  });

  test("no NEW genres row points at a missing poet", () => {
    for (const row of raw.genres) {
      if (KNOWN_ORPHAN_GENRE_POET_IDS.has(id(row.poetId))) continue;
      assert.ok(poetIds.has(id(row.poetId)), `${row.genres_poetname} has unknown poetId ${row.poetId}`);
    }
  });

  test("every dates row resolves to a poet", () => {
    for (const row of raw.dates) {
      assert.ok(poetIds.has(id(row.poetId)), `${row.dates_poetname} has unknown poetId ${row.poetId}`);
    }
  });

  test("every city_politics row resolves to a city and a government", () => {
    for (const row of raw.cityPolitics) {
      if (filled(row.cityId)) {
        assert.ok(cityIds.has(id(row.cityId)), `${row.city} has unknown cityId ${row.cityId}`);
      }
      assert.ok(governmentIds.has(id(row.governmentId)), `${row.city} has unknown governmentId ${row.governmentId}`);
    }
  });

  test("every city's region, and every region's big region, resolves", () => {
    for (const city of raw.cities) {
      if (!filled(city.regionId)) continue;
      assert.ok(regionIds.has(id(city.regionId)), `${city.cityname} has unknown regionId ${city.regionId}`);
    }
    for (const region of raw.regions) {
      if (!filled(region.bigRegionId)) continue;
      assert.ok(
        bigRegionIds.has(id(region.bigRegionId)),
        `${region.regionname} has unknown bigRegionId ${region.bigRegionId}`
      );
    }
  });

  // The other direction. Every test above asks whether a row's cityId resolves;
  // this asks whether a city is reachable from any row, which is what decides
  // whether it is ever drawn or exercised. Claros sat in cities.csv for two
  // years with a latitude of 384725 because nothing referenced it, so nothing
  // ran over it — the coordinate check skipped it by way of an exception set.
  test("every city is referenced by some citation", () => {
    const referenced = new Set(
      [...raw.poetCities, ...raw.geopoetCities].filter(row => filled(row.cityId)).map(row => id(row.cityId))
    );
    for (const city of raw.cities) {
      if (KNOWN_UNREFERENCED_CITY_IDS.has(id(city.cityId))) continue;
      assert.ok(
        referenced.has(id(city.cityId)),
        `${city.cityname} (cityId ${city.cityId}) is in cities.csv but no citation points at it, ` +
          `so no map draws it — add the citation, or move the row to removed_data.txt`
      );
    }
  });
});

describe("labels agree with the ids they point at", () => {
  // A row labelled with one place but pointing at another's id draws the
  // reference in the wrong location, which is invisible without this check.
  test("no NEW cityname disagrees with the city it references", () => {
    for (const file of POET_CITY_CSVS) {
      for (const row of raw[file]) {
        const cityId = id(row.cityId);
        if (!filled(row.cityname) || !cityNameById.has(cityId)) continue;
        const actual = cityNameById.get(cityId);
        if (actual === row.cityname) continue;
        assert.ok(
          acceptedCityLabels.has(`${cityId}|${row.cityname}`),
          `${file}: row labelled "${row.cityname}" points at cityId ${cityId}, which is "${actual}"`
        );
      }
    }
  });
});

describe("field values", () => {
  test("relationshipId is 1, 2, 3 or blank", () => {
    for (const row of raw.poetCities) {
      if (!filled(row.relationshipId)) continue; // blank = unclassified, excluded from travel
      assert.ok(
        [1, 2, 3].includes(id(row.relationshipId)),
        `${row.poetname} -> ${row.cityname} has relationshipId ${row.relationshipId}`
      );
    }
  });

  test("coordinates are either both blank or both plausible for the mapped world", () => {
    for (const city of raw.cities) {
      const hasLat = filled(city.lat);
      const hasLong = filled(city.long);
      assert.equal(hasLat, hasLong, `${city.cityname} has only one of lat/long`);
      if (!hasLat) continue;
      const lat = parseFloat(city.lat);
      const long = parseFloat(city.long);
      assert.ok(Number.isFinite(lat) && Number.isFinite(long), `${city.cityname} has unparseable coordinates`);
      assert.ok(
        lat > WORLD_BOUNDS.minLat && lat < WORLD_BOUNDS.maxLat,
        `${city.cityname} latitude ${lat} is outside the mapped world — a lost decimal point?`
      );
      assert.ok(
        long > WORLD_BOUNDS.minLong && long < WORLD_BOUNDS.maxLong,
        `${city.cityname} longitude ${long} is outside the mapped world — a lost decimal point?`
      );
    }
  });

  test("dates are parseable years", () => {
    for (const row of raw.dates) {
      assert.ok(Number.isFinite(parseInt(row.date)), `${row.dates_poetname} has unparseable date "${row.date}"`);
    }
  });

  test("every poet has a detail name, which is what popups display", () => {
    for (const poet of raw.poets) {
      assert.ok(filled(poet.poetDetailName), `${poet.poetname} has no poetDetailName`);
    }
  });
});

describe("citations", () => {
  // Issue #329 ("Citations broken again") and #313 ("citations are
  // inconsistent") were both this shape.
  test("geographical imaginary citations are complete", () => {
    for (const row of raw.geopoetCities) {
      if (!filled(row.source_citation)) continue;
      assert.ok(filled(row.source_translation), `${row.poetname} ${row.source_citation} has no translation`);
      assert.ok(filled(row.source_translator), `${row.poetname} ${row.source_citation} has no translator`);
    }
  });

  test("genre citations are complete", () => {
    for (const row of raw.genres) {
      if (!filled(row.source_citation)) continue;
      assert.ok(filled(row.source_translation), `${row.genres_poetname} ${row.source_citation} has no translation`);
      assert.ok(filled(row.source_translator), `${row.genres_poetname} ${row.source_citation} has no translator`);
    }
  });

  test("incomplete poets_cities citations do not increase", () => {
    const incomplete = raw.poetCities.filter(
      row => filled(row.source_citation) && !(filled(row.source_translation) && filled(row.source_translator))
    );
    assert.ok(
      incomplete.length <= KNOWN_INCOMPLETE_CITATION_COUNT,
      `${incomplete.length} poets_cities rows have a citation without a full translation ` +
        `(was ${KNOWN_INCOMPLETE_CITATION_COUNT}); newly incomplete: ` +
        incomplete
          .slice(0, 5)
          .map(r => `${r.poetname}/${r.cityname}`)
          .join(", ")
    );
  });
});

describe("Greek text", () => {
  // The corpus is stored in NFC, i.e. with the canonical "tonos" codepoints
  // (ά = U+03AC) rather than the legacy "oxia" ones (ά = U+1F71). The two
  // render identically, so a mixture is invisible on screen but silently breaks
  // text search over the corpus — in a browser, an editor, or against TLG
  // output, which uses tonos.
  //
  // Spreadsheets and older Greek keyboards happily reintroduce oxia, so this is
  // checked on every file rather than only the Greek columns.
  test("every data file is NFC-normalised", () => {
    for (const [name, rows] of Object.entries(raw)) {
      for (const row of rows) {
        for (const [column, value] of Object.entries(row)) {
          if (!value) continue;
          assert.equal(
            value,
            value.normalize("NFC"),
            `${name}.${column} is not NFC-normalised: ${JSON.stringify(value.slice(0, 60))}`
          );
        }
      }
    }
  });

  test("source_greektext holds source-language text", () => {
    // Despite the column name it holds the text in its original language, which
    // for three testimonia is Latin: Quintilian and Cicero on Simonides at the
    // house of Scopas, and Pliny on Telestes. Anything else in there without a
    // Greek letter is a data-entry slip.
    const LATIN_SOURCE_WORKS = new Set(["Quintilian", "Cicero", "Pliny"]);
    // The three tables name these columns differently: geographical_imaginary_group
    // has original_source where the others have source_work, and genres.csv keys
    // the poet as genres_poetname.
    for (const row of raw.poetCities) {
      if (!filled(row.source_greektext) || /\p{Script=Greek}/u.test(row.source_greektext)) continue;
      assert.ok(
        LATIN_SOURCE_WORKS.has(row.source_work),
        `poets_cities: ${row.poetname} has non-Greek source_greektext from "${row.source_work}"`
      );
    }
    for (const row of raw.geopoetCities) {
      if (!filled(row.source_greektext) || /\p{Script=Greek}/u.test(row.source_greektext)) continue;
      assert.ok(
        LATIN_SOURCE_WORKS.has(row.original_source),
        `geographical_imaginary: ${row.poetname} has non-Greek source_greektext from "${row.original_source}"`
      );
    }
    for (const row of raw.genres) {
      if (!filled(row.source_greektext) || /\p{Script=Greek}/u.test(row.source_greektext)) continue;
      assert.ok(
        LATIN_SOURCE_WORKS.has(row.source_work),
        `genres: ${row.genres_poetname} has non-Greek source_greektext from "${row.source_work}"`
      );
    }
  });
});

describe("csv schema", () => {
  // types/csv.d.ts declares the columns of each file, and loadRawCsvs() casts
  // the parsed rows to those types. This test is what keeps that cast honest:
  // rename or reorder a column in a spreadsheet and it fails here, pointing at
  // the declaration that now needs updating.
  /** @type {Record<keyof RawCsvs, string[]>} */
  const EXPECTED_COLUMNS = {
    regions: ["regionId", "bigRegionId", "regionname"],
    cities: ["cityname", "infowindowName", "cityId", "notes", "lat", "long", "region", "regionId"],
    poetCities: [
      "poetname",
      "poetId",
      "cityname",
      "cityId",
      "relationship",
      "relationshipId",
      "nativeid",
      "dotted",
      "notes",
      "source_work",
      "source_workid",
      "source_citation",
      "source_greektext",
      "source_translation",
      "source_translator",
      "source_notes",
      "source_explicit"
    ],
    poets: ["poetname", "poetDetailName", "poetId", "sources", "dates", "dates_source", "notes"],
    genres: [
      "genres_poetname",
      "poetId",
      "genre",
      "genreId",
      "source_work",
      "source_workid",
      "source_citation",
      "source_greektext",
      "source_translation",
      "source_translator",
      "source_notes",
      "source_explicit",
      "notes",
      "source"
    ],
    geopoetCities: [
      "imaginaryid",
      "poetname",
      "poetId",
      "cityname",
      "cityId",
      "relationship",
      "destination",
      "destination_id",
      "speaker",
      "speakerid",
      "notes",
      "source_poem",
      "source_citation",
      "original_source",
      "source_greektext",
      "source_translation",
      "source_translator",
      "source_notes",
      "source_explicit"
    ],
    cityPolitics: ["city", "cityId", "government", "governmentId", "questionable?", "date", "notes"],
    bigRegions: ["regionId", "regionname"],
    dates: ["dates_poetname", "poetId", "date", "iso_8601", "notes"],
    governments: ["government", "governmentId"]
  };

  for (const [name, expected] of Object.entries(EXPECTED_COLUMNS)) {
    test(`${name} has exactly the columns types/csv.d.ts declares`, () => {
      const rows = raw[/** @type {keyof RawCsvs} */ (name)];
      assert.ok(rows.length > 0, `${name} is empty`);
      assert.deepEqual(Object.keys(rows[0]), expected);
    });
  }
});

describe("hygiene", () => {
  test("names have no leading or trailing whitespace", () => {
    // A stray space, or a newline inside a quoted field, is easy to introduce
    // from a spreadsheet and hard to spot afterwards. The display names are
    // checked alongside the sort names because both halves of a row are edited
    // together and both went wrong together in Plataea and Lamynthios.
    const offenders = [];
    for (const city of raw.cities) {
      for (const name of [city.cityname, city.infowindowName]) {
        if (name !== name.trim()) offenders.push(`cities.csv: ${JSON.stringify(name)}`);
      }
    }
    for (const poet of raw.poets) {
      for (const name of [poet.poetname, poet.poetDetailName]) {
        if (name !== name.trim()) offenders.push(`poets.csv: ${JSON.stringify(name)}`);
      }
    }
    assert.deepEqual(offenders, [], `unexpected whitespace in names:\n  ${offenders.join("\n  ")}`);
  });

  test("every poet has dates", () => {
    // getDateFilterFn() is the only reader, and it compares against the min and
    // max derived from these rows. A poet with no dates is silently filtered off
    // the map entirely, so this is asserted for all of poets.csv rather than
    // only the poets currently placed on it.
    const dated = new Set(raw.dates.map(row => id(row.poetId)));
    for (const poet of raw.poets) {
      assert.ok(
        dated.has(id(poet.poetId)),
        `${poet.poetname} has no rows in dates.csv, so would be invisible on the map`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// KNOWN DATA BUGS
//
// Every test below asserts what the data currently gets WRONG. They pass while
// the bug is present, which inverts the usual reading of a green suite, so each
// is named "BUG:" to make that unmistakable.
//
// When someone fixes one of these, its test will fail. That failure is the
// signal to DELETE THE TEST — and the matching entry in the exception sets at
// the top of this file — not to restore the bug.
//
// Coordinates below come from Pleiades (https://pleiades.stoa.org), which is
// where this project's existing coordinates come from: cities.csv's Heracleia
// Trachinia matches pleiades:541157 to all six decimal places.
// ---------------------------------------------------------------------------

/**
 * cities.csv row for an id, asserting it exists. Used by the bug tests below,
 * where a missing row means the bug has been fixed and the test should go.
 * @param {number} cityId
 * @returns {RawCity}
 */
function cityById(cityId) {
  const city = raw.cities.find(c => id(c.cityId) === cityId);
  assert.ok(city, `cityId ${cityId} is no longer in cities.csv`);
  return city;
}

/**
 * The single row in a join table carrying a given cityname label.
 * @param {PoetCityCsv} file
 * @param {string} label
 * @returns {RawPoetCity | RawGeoPoetCity}
 */
function soleRowLabelled(file, label) {
  const rows = raw[file].filter(row => row.cityname === label);
  assert.equal(rows.length, 1, `expected exactly one row labelled ${label} in ${file}`);
  return rows[0];
}

describe("known data bugs: places plotted in the wrong location", () => {
  test("BUG: Pindar's Camarina is plotted on Erythrae, in Ionia rather than Sicily", () => {
    assert.equal(id(soleRowLabelled("poetCities", "Camarina").cityId), 254);
    const city = cityById(254);
    assert.equal(city.cityname, "Erythrae");
    assert.equal(city.lat, "38.382778");
    assert.equal(city.long, "26.480833");
    // Camarina is pleiades:462126 at 36.8718784874, 14.4483234195 — the Syracusan
    // foundation of 599 BC, and the city of Psaumis in Olympians 4 and 5. It is
    // roughly 1,100km from where it is currently drawn, in a different sea.
    // Fixing means adding Camarina to cities.csv and repointing this row.
    assert.ok(
      !raw.cities.some(c => c.cityname === "Camarina"),
      "Camarina now exists in cities.csv; repoint the row and delete this test"
    );
  });

  test("BUG: Pindar's Cyrene is plotted on Phocaea, in Ionia rather than Libya", () => {
    assert.equal(id(soleRowLabelled("poetCities", "Cyrene").cityId), 255);
    const city = cityById(255);
    assert.equal(city.cityname, "Phocaea");
    assert.equal(city.lat, "38.670353");
    assert.equal(city.long, "26.753208");
    // Cyrene is pleiades:373778 at 32.8200266273, 21.8565385134 — the city of
    // Arcesilas and Telesicrates in Pythians 4, 5 and 9. It is currently drawn
    // on the wrong continent.
    assert.ok(
      !raw.cities.some(c => c.cityname === "Cyrene"),
      "Cyrene now exists in cities.csv; repoint the row and delete this test"
    );
  });

  test("BUG: Stesichorus' Phocis is plotted on Aetolia", () => {
    assert.equal(id(soleRowLabelled("geopoetCities", "Phocis").cityId), 134);
    assert.equal(cityById(134).cityname, "Aetolia");
    // Stesichorus fr. 222 names both places, and both rows were given cityId 134.
    // Phocis is pleiades:541048 at 38.5557075728, 22.686575589.
    assert.equal(
      id(soleRowLabelled("geopoetCities", "Aetolia").cityId),
      134,
      "the same fragment also refers to Aetolia itself"
    );
  });
});

describe("known data bugs: rows that never reach the map", () => {
  test("BUG: 13 geographical imaginary citations point at cities that do not exist", () => {
    const orphans = raw.geopoetCities.filter(row => filled(row.cityId) && !cityIds.has(id(row.cityId)));
    assert.equal(orphans.length, 13);
    assert.equal(new Set(orphans.map(row => id(row.cityId))).size, 12);
    // The bubble builders skip any row whose cityId does not resolve, so these
    // citations are researched, translated, cited — and render nowhere.
    //
    // Three are locatable in Pleiades:
    //   217 Phthia      -> Achaea Phthiotis, pleiades:540585, 39.05279336, 22.5324060812
    //   227 Corax       -> Koraxoi, pleiades:857198, 43.3454532124, 40.5402046191
    //                      (the Colchian people, not Mt Korax in Aetolia)
    //   228 Cylicrania  -> the Kylikranes lived at Herakleia Trachinia, already
    //                      cityId 74; the fragment names Herakleia in its next line
    //
    // Three are judgement calls: 154 Dryopis/Doris (two rows share the id, and
    // the Telestes one is the Dorian musical mode, not a place), 165 Denthiades
    // (a wine), 221 Sintia (the Greek is corrupt).
    //
    // Six look genuinely unlocatable: 156 Annichorum, 170 Five Crests, 172 Ibe,
    // 173 Nyrsylas, 238 Mytalis, 239 Phlyesia.
    assert.deepEqual(
      [...new Set(orphans.map(row => id(row.cityId)))].sort((a, b) => a - b),
      [154, 156, 165, 170, 172, 173, 217, 221, 227, 228, 238, 239]
    );
  });

  test("BUG: 8 genres rows belong to poets that are not in poets.csv", () => {
    const orphans = raw.genres.filter(row => !poetIds.has(id(row.poetId)));
    assert.equal(orphans.length, 8);
    assert.deepEqual(
      [...new Set(orphans.map(row => id(row.poetId)))].sort((a, b) => a - b),
      [14, 31, 33, 113]
    );
    // These poets appear to have been renumbered: there is both an Aristotle 31
    // and an Aristotle 151, a Kastorion 33 and a Castorion, a Kinesias 14 and a
    // Cinesias 4. getGenres() returns [] for them, so the rows are simply dead.
  });
});

describe("known data bugs: incomplete or inconsistent fields", () => {
  test("BUG: 18 poets_cities citations have no translation or translator", () => {
    const incomplete = raw.poetCities.filter(
      row => filled(row.source_citation) && !(filled(row.source_translation) && filled(row.source_translator))
    );
    assert.equal(incomplete.length, KNOWN_INCOMPLETE_CITATION_COUNT);
    // renderReference() prints `Citation: X: "" (trans. )` for these. This is
    // the shape of issues #313 and #329. geopoetCities and genres are clean.
    for (const file of CLEAN_CITED_CSVS) {
      const bad = raw[file].filter(
        row => filled(row.source_citation) && !(filled(row.source_translation) && filled(row.source_translator))
      );
      assert.equal(bad.length, 0);
    }
  });
});
