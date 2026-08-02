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
 * Runs fn with alert() and console.log() collected rather than printed, and
 * hands back what it returned alongside what it said.
 *
 * Those two are how the app reports an id that resolves to nothing, and neither
 * should ever fire against good data — so capturing them is both what lets a
 * test assert on the report and what keeps a test that provokes one on purpose
 * from printing it into the TAP output.
 * @template T
 * @param {() => T} fn
 * @returns {{ result: T, alerts: string[], logs: string[] }}
 */
export function captureReports(fn) {
  /** @type {string[]} */
  const alerts = [];
  /** @type {string[]} */
  const logs = [];

  const globals = /** @type {{ alert?: (message: string) => void }} */ (globalThis);
  const realAlert = globals.alert;
  const realLog = console.log;
  globals.alert = message => alerts.push(String(message));
  console.log = (/** @type {unknown[]} */ ...args) => logs.push(args.join(" "));

  try {
    return { result: fn(), alerts, logs };
  } finally {
    globals.alert = realAlert;
    console.log = realLog;
  }
}

/**
 * The CSVs run through the real initializeData(), i.e. the same object the
 * browser builds before it draws anything. Use this for behaviour assertions.
 *
 * Takes the raw CSVs so that a test can break one row on purpose and watch what
 * startup does with it — the only way to reach the missing-id paths, since the
 * referential-integrity tests exist to keep the real files off them. Pass a
 * fresh loadRawCsvs(): hydrate() parses the rows in place, so they are not
 * reusable between calls.
 * @param {RawCsvs} [raw] defaults to the CSVs as they sit on disk
 * @returns {{ data: Data, alerts: string[], logs: string[] }}
 */
export function loadInitializedData(raw = loadRawCsvs()) {
  const { result, alerts, logs } = captureReports(() => initializeData(raw));
  return { data: result, alerts, logs };
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
