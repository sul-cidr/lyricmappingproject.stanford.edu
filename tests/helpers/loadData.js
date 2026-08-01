import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseCsv } from "./csv.js";
import { initializeData } from "../../js/calcData/data.js";

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
 * The app reports missing lookups by calling alert() and console.log(), neither
 * of which should ever fire against good data, so both are captured and handed
 * back for assertion rather than printed.
 * @returns {{ data: Data, alerts: string[], logs: string[] }}
 */
export function loadInitializedData() {
  // initializeData() hydrates the raw rows in place, turning the RawCsvs shape
  // into the Data shape js/ works with.
  const data = /** @type {Data} */ (/** @type {unknown} */ (loadRawCsvs()));

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
    initializeData(data);
  } finally {
    globals.alert = realAlert;
    console.log = realLog;
  }

  return { data, alerts, logs };
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
