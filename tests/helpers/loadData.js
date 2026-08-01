import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseCsv } from "./csv.js";
import { initializeData } from "../../js/calcData/data.js";

const dataFilesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "dataFiles");

/** The data-bag key each CSV is loaded onto, mirroring js/calcData/parseCsvs.js. */
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
 */
export function loadRawCsvs() {
  const raw = {};
  for (const [key, filename] of Object.entries(FILES)) {
    raw[key] = parseCsv(readFileSync(join(dataFilesDir, filename), "utf8"));
  }
  return raw;
}

/**
 * The CSVs run through the real initializeData(), i.e. the same object the
 * browser builds before it draws anything. Use this for behaviour assertions.
 *
 * The app reports missing lookups by calling alert() and console.log(), neither
 * of which should ever fire against good data, so both are captured and handed
 * back for assertion rather than printed.
 */
export function loadInitializedData() {
  const data = loadRawCsvs();

  const alerts = [];
  const logs = [];

  const realAlert = (globalThis).alert;
  const realLog = console.log;
  (globalThis).alert = (message) => alerts.push(String(message));
  console.log = (...args) => logs.push(args.join(" "));

  try {
    initializeData((data));
  } finally {
    (globalThis).alert = realAlert;
    console.log = realLog;
  }

  return { data, alerts, logs };
}

/**
 * Ids are written inconsistently in the CSVs — "132", "132.00", "" — and the
 * app normalises them with parseInt. Tests must compare them the same way.
 */
export function toId(value) {
  return parseInt(value);
}
