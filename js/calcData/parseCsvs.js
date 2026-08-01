/**
 * @param {string} file raw CSV text
 * @returns {Promise<{ data: any[] }>}
 */
async function papaParsePromise(file) {
  return new Promise(function (complete, error) {
    Papa.parse(file, { header: true, complete, error });
  });
}

/**
 * Loads every CSV in dataFiles/ onto the shared data bag. Papa Parse yields
 * every field as a string; initializeData() hydrates the numeric ones.
 * @param {Data} data
 * @returns {Promise<any[]>}
 */
export async function parseCsvs(data) {
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
 */
async function parseCsv(data, parameter, filename) {
  return fetch(filename)
    .then(file => file.text())
    .then(fileText => papaParsePromise(fileText))
    .then(papaParsed => (data[parameter] = papaParsed.data));
}
