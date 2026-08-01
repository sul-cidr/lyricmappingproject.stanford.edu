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
 * Loads every CSV in dataFiles/ onto the shared data bag. Papa Parse yields
 * every field as a string; initializeData() hydrates the numeric ones.
 * @param {Data} data
 * @returns {Promise<void[]>}
 */
export function parseCsvs(data) {
  return Promise.all([
    parseCsv(data, "regions", "./dataFiles/regions.csv"),
    parseCsv(data, "cities", "./dataFiles/cities.csv"),
    parseCsv(data, "poetCities", "./dataFiles/poets_cities.csv"),
    parseCsv(data, "poets", "./dataFiles/poets.csv"),
    parseCsv(data, "genres", "./dataFiles/genres.csv"),
    parseCsv(data, "geopoetCities", "./dataFiles/geographical_imaginary_group.csv"),
    parseCsv(data, "cityPolitics", "./dataFiles/city_politics.csv"),
    parseCsv(data, "bigRegions", "./dataFiles/big_regions.csv"),
    parseCsv(data, "dates", "./dataFiles/dates.csv"),
    parseCsv(data, "governments", "./dataFiles/governments.csv")
  ]);
}

/**
 * @param {Data} data
 * @param {keyof Data} parameter which key on the data bag to populate
 * @param {string} filename
 * @returns {Promise<void>}
 */
async function parseCsv(data, parameter, filename) {
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
  data[parameter] = parsed.data;
}
