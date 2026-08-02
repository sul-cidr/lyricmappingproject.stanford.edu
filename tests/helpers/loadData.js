import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseCsv } from "./csv.js";
import { initializeData } from "../../js/calcData/data.js";
import { mapStateFrom } from "../../js/calcData/getters.js";

const dataFilesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "dataFiles");

/**
 * The data-bag key each CSV is loaded onto, mirroring js/calcData/parseCsvs.js.
 * @type {Record<keyof RawCsvs, string>}
 */
const FILES = {
  regions: "regions.csv",
  cities: "cities.csv",
  poetCities: "poets_cities.csv",
  poets: "poets.csv",
  genres: "genres.csv",
  geopoetCities: "geographical_imaginary_group.csv",
  cityPolitics: "city_politics.csv",
  bigRegions: "big_regions.csv",
  dates: "dates.csv",
  governments: "governments.csv"
};

/**
 * The CSVs exactly as they sit on disk: every field a string, nothing derived.
 * Use this for data-integrity assertions.
 *
 * parseCsv returns whatever columns the header row declares. The cast asserts
 * that those columns are the ones types/csv.d.ts describes, which the "every
 * expected column is present" test in data-integrity.test.js checks at runtime.
 * @returns {RawCsvs}
 */
export function loadRawCsvs() {
  const raw = /** @type {Record<string, unknown>} */ ({});
  for (const [key, filename] of Object.entries(FILES)) {
    raw[key] = parseCsv(readFileSync(join(dataFilesDir, filename), "utf8"));
  }
  return /** @type {RawCsvs} */ (/** @type {unknown} */ (raw));
}

/**
 * The CSVs run through the real initializeData(), i.e. the same object the
 * browser builds before it draws anything. Use this for behaviour assertions.
 *
 * The app reports missing lookups by calling console.error() and console.log(),
 * neither of which should ever fire against good data, so both are captured and
 * handed back for assertion rather than printed.
 * @returns {{ data: Data, errors: string[], logs: string[] }}
 */
export function loadInitializedData() {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const logs = [];

  const realError = console.error;
  const realLog = console.log;
  console.error = (/** @type {unknown[]} */ ...args) => errors.push(args.join(" "));
  console.log = (/** @type {unknown[]} */ ...args) => logs.push(args.join(" "));

  try {
    return { data: initializeData(loadRawCsvs()), errors, logs };
  } finally {
    console.error = realError;
    console.log = realLog;
  }
}

/** The whole slider range, i.e. what a map shows before anything is dragged. */
export const ALL_DATES = { minDate: -800, maxDate: -400 };

/**
 * A State as the browser holds it: a map mode paired with the filter its control
 * bar has selected, plus a date range.
 *
 * Built through mapStateFrom(), which is the same call the click handlers make,
 * so a test cannot quietly assert against a mode-and-filter pair the map has no
 * way to produce — asking for one throws here rather than rendering something
 * the application never shows.
 * @param {MapMode} currentMapMode
 * @param {string} selectedId
 * @param {{ minDate: number, maxDate: number }} [dates]
 * @returns {State}
 */
export function stateFor(currentMapMode, selectedId, dates = ALL_DATES) {
  return { map: mapStateFrom(currentMapMode, selectedId), ...dates };
}

/**
 * Ids are written inconsistently in the CSVs — "132", "132.00", "" — and the
 * app normalises them with parseInt. Tests must compare them the same way.
 * @param {string} value
 * @returns {number} NaN when the field is blank or unparseable
 */
export function toId(value) {
  return parseInt(value);
}
