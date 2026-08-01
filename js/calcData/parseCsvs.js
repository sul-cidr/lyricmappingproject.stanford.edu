/**
 * Every CSV the map loads, against the key it is loaded onto.
 *
 * One record rather than ten calls, so the mapping is total: a key of RawCsvs
 * with no file here, or a key here that RawCsvs does not declare, is a type
 * error. Passing the wrong filename for a key used to typecheck perfectly.
 * @type {Record<keyof RawCsvs, string>}
 */
const CSV_FILES = {
  regions: "./dataFiles/regions.csv",
  cities: "./dataFiles/cities.csv",
  poetCities: "./dataFiles/poets_cities.csv",
  poets: "./dataFiles/poets.csv",
  genres: "./dataFiles/genres.csv",
  geopoetCities: "./dataFiles/geographical_imaginary_group.csv",
  cityPolitics: "./dataFiles/city_politics.csv",
  bigRegions: "./dataFiles/big_regions.csv",
  dates: "./dataFiles/dates.csv",
  governments: "./dataFiles/governments.csv"
};

/**
 * @param {string} file raw CSV text
 * @returns {Promise<{ data: any[] }>}
 */
function papaParsePromise(file) {
  return new Promise(function (complete, error) {
    Papa.parse(file, { header: true, complete, error });
  });
}

/**
 * Loads every CSV in dataFiles/. Papa Parse yields every field as a string;
 * initializeData() hydrates the numeric ones.
 * @returns {Promise<RawCsvs>}
 */
export async function parseCsvs() {
  /** @type {Record<string, any[]>} */
  const raw = {};
  await Promise.all(
    Object.entries(CSV_FILES).map(async ([key, filename]) => {
      raw[key] = await parseCsv(filename);
    })
  );
  // CSV_FILES is declared as a Record over every key of RawCsvs, so the loop
  // above has filled all of them. That is the whole of what this asserts.
  return /** @type {RawCsvs} */ (/** @type {unknown} */ (raw));
}

/**
 * @param {string} filename
 * @returns {Promise<any[]>}
 */
async function parseCsv(filename) {
  const response = await fetch(filename);
  // fetch resolves for a 404, so without this the error page is parsed as CSV
  // and the map draws nothing, with no indication why.
  if (!response.ok) {
    const message = `could not load ${filename}: ${response.status} ${response.statusText}`;
    alert(message);
    throw new Error(message);
  }
  const csv = await response.text();
  const parsed = await papaParsePromise(csv);
  return parsed.data;
}
