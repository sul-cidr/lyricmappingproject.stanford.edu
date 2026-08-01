import { getPoet, getCity, getGenres, getGovs } from "./getters.js";

/**
 * Hydrates the raw CSV rows in place (ids and coordinates become numbers, dates
 * become negative years) and builds every derived lookup the map needs.
 * @param {Data} data
 */
export function initializeData(data) {
  // Papa Parse hands back every field as a string. These arrays are aliased as
  // any[] for the hydration pass below; everywhere else in the codebase they
  // are the hydrated types declared in types/globals.d.ts.
  /** @type {any[]} */ const rawGenres = data.genres;
  /** @type {any[]} */ const rawCities = data.cities;
  /** @type {any[]} */ const rawCityPolitics = data.cityPolitics;
  /** @type {any[]} */ const rawPoetCities = data.poetCities;
  /** @type {any[]} */ const rawGeopoetCities = data.geopoetCities;
  /** @type {any[]} */ const rawRegions = data.regions;
  /** @type {any[]} */ const rawDates = data.dates;
  /** @type {any[]} */ const rawGovernments = data.governments;

  rawGenres.forEach(genre => genre.genreId = parseInt(genre.genreId));
  rawCities.forEach(city => city.cityId = parseInt(city.cityId));
  rawCities.forEach(city => city.regionId = parseInt(city.regionId));
  rawCities.forEach(city => city.lat = parseFloat(city.lat));
  rawCities.forEach(city => city.long = parseFloat(city.long));
  rawCityPolitics.forEach(city => city.cityId = parseInt(city.cityId));
  rawCityPolitics.forEach(city => city.governmentId = parseInt(city.governmentId));
  rawCityPolitics.forEach(cp => cp.date = -1 * parseInt(cp.date));
  rawPoetCities.forEach(poetCity => poetCity.relationshipId = parseInt(poetCity.relationshipId));
  rawPoetCities.forEach(poetCity => poetCity.poetId = parseInt(poetCity.poetId));
  rawPoetCities.forEach(poetCity => poetCity.cityId = parseInt(poetCity.cityId));
  rawGeopoetCities.forEach(poetCity => poetCity.poetId = parseInt(poetCity.poetId));
  rawGeopoetCities.forEach(poetCity => poetCity.imaginaryid = parseInt(poetCity.imaginaryid));
  rawGeopoetCities.forEach(poetCity => poetCity.cityId = parseInt(poetCity.cityId));
  rawRegions.forEach(region => region.regionId = parseInt(region.regionId));
  rawRegions.forEach(region => region.bigRegionId = parseInt(region.bigRegionId));
  rawDates.forEach(date => {
    date.poetId = parseInt(date.poetId);
    date.date = -1 * parseInt(date.date);
  })
  rawGovernments.forEach(gov => gov.governmentId = parseInt(gov.governmentId));

  // create useful maps by key
  data.citiesById = {}
  for (const city of data.cities) {
    data.citiesById[city.cityId] = city;
  }
  data.poetsById = {}
  for (const poet of data.poets) {
    data.poetsById[poet.poetId] = poet;
  }
  data.genresByPoetId = {}
  for (const genre of data.genres) {
    if (!data.genresByPoetId[genre.poetId]) {
      data.genresByPoetId[genre.poetId] = [];
    }
    data.genresByPoetId[genre.poetId].push(genre);
  }
  data.regionsById = {}
  for (const region of data.regions) {
    data.regionsById[region.regionId] = region;
  }
  addBigRegionIdToCities(data);
  addDatesToPoets(data);

  createGovsByCityId(data);
  createGovsById(data);
  createGenresByGenreId(data);
  createGenreIdsWithNames(data);
  createGeoImaginaryPoets(data);
  createLines(data);
  keyLines(data);
  createTravelPoets(data);
  createTravelCities(data);
  createRegionsForInterface(data);
  data.poetCities.forEach(pc => primeObjWithPoetData(pc, data));
  data.geopoetCities.forEach(pc => primeObjWithPoetData(pc, data));
  sortPoetCities(data, data.poetCities);
  sortPoetCities(data, data.geopoetCities);
}

/**
 * @param {Data} data
 * @param {(PoetCity | GeoPoetCity)[]} poetCities
 */
function sortPoetCities(data, poetCities) {
  poetCities.sort((a, b) => {
    const poetA = getPoet(data, a.poetId);
    const poetB = getPoet(data, b.poetId);
    return sortAlphabetically(poetA.poetname, poetB.poetname);
  })
}

/**
 * Copies a poet's display name, dates, sources and genres onto a row (or a
 * travel line) so popups can render without a second lookup.
 * @param {{ poetId: number, poetname?: string } & Partial<PoetPrimed>} obj
 * @param {Data} data
 */
function primeObjWithPoetData(obj, data) {
  const poet = getPoet(data, obj.poetId);

  obj.poetDetailName = "";
  if (poet.poetDetailName) obj.poetDetailName = poet.poetDetailName;
  else alert(`Poet ${obj.poetname} with poetId ${obj.poetId} lacks a details name`);

  obj.poetDates = "";
  if (poet.dates) obj.poetDates = poet.dates;
  else console.log(`Poet ${obj.poetname} with poetId ${obj.poetId} lacks dates`);

  obj.poetSources = "";
  if (poet.sources) obj.poetSources = poet.sources;
  else console.log(`Poet ${obj.poetname} with poetId ${obj.poetId} lacks sources`);

  const genres = getGenres(data, obj.poetId);
  obj.poetGenres = genres.map(genre => genre.genre).join(", ");
}

/**
 * Sorts alphabetically, but pushes names starting with a non-letter (e.g. Greek
 * characters) to the end.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function sortAlphabetically(a, b) {
  const aIsLetter = a.charAt(0).match(/[a-z]/i) !== null;
  const bIsLetter = b.charAt(0).match(/[a-z]/i) !== null;
  if (aIsLetter && !bIsLetter) return -1;
  if (!aIsLetter && bIsLetter) return 1;
  return a < b ? -1 : 1;
}

/** @param {Data} data */
function createGovsByCityId(data) {
  data.govsByCityId = {};
  for (const cp of data.cityPolitics) {
    if (!data.govsByCityId[cp.cityId]) data.govsByCityId[cp.cityId] = [];
    data.govsByCityId[cp.cityId].push(cp);
  }
}

/** @param {Data} data */
function createGovsById(data) {
  data.govsById = {};
  for (const gov of data.governments) {
    data.govsById[gov.governmentId] = gov.government;
  }
}

/** @param {Data} data */
function addBigRegionIdToCities(data) {
  for (const city of data.cities) {
    if (
      city.regionId &&
      data.regionsById[city.regionId] &&
      data.regionsById[city.regionId].bigRegionId
    ) {
      city.bigRegionId = data.regionsById[city.regionId].bigRegionId;
    }
  }
}

/** @param {Data} data */
function addDatesToPoets(data) {
  data.datesByPoetId = {};
  for (const date of data.dates) {
    if (!data.datesByPoetId[date.poetId]) data.datesByPoetId[date.poetId] = [];
    data.datesByPoetId[date.poetId].push(date.date);
  }
  for (const poetIdStr in data.datesByPoetId) {
    const poetId = Number(poetIdStr);
    const poet = getPoet(data, poetId);
    if (poet) {
      poet.minDate = Math.min(...data.datesByPoetId[poetId]);
      poet.maxDate = Math.max(...data.datesByPoetId[poetId]);
    }
  }
}

/** @param {Data} data */
function createGenresByGenreId(data) {
  data.genresByGenreId = {}
  for (const genre of data.genres) {
    const genreName = genre.genre;
    if (!data.genresByGenreId[genre.genreId]) {
      data.genresByGenreId[genre.genreId] = genreName;
    }
    else {
      const existingGenreName = data.genresByGenreId[genre.genreId];
      if (genreName !== existingGenreName) {
        console.log(`${genreName} has genreId ${genre.genreId} but does not match existing ${existingGenreName}. Source translation: "${genre.source_translation}"`);
      }
    }
  }
}

/**
 * @param {Iterable<number>} poetIds
 * @param {Data} data
 * @returns {IdNameTuple[]}
 */
function createAlphabetizedListOfPoetsFromIds(poetIds, data) {
  /** @type {IdNameTuple[]} */
  const tuples = Array
    .from(poetIds)
    .map(poetId => [poetId, getPoet(data, poetId).poetDetailName]);
  return tuples.sort((a, b) => sortAlphabetically(a[1], b[1]));
}

/** @param {Data} data */
function createGeoImaginaryPoets(data) {
  const poetIdsToOmit = [
    151, // Aristotle
    33,  // Castorion
    4,   // Cinesias
    100, // Bacchylides
    149  // Pindar
  ]

  const poetIds = new Set(
    data.geopoetCities
      .map(pc => pc.poetId)
      .filter(poetId => !poetIdsToOmit.includes(poetId))
  );

  data.geoImaginaryPoets = createAlphabetizedListOfPoetsFromIds(poetIds, data);

  // put sappho / alcaeus at end of array
  const sappAlcPoetId = 157;
  putPoetIdAtEndOfPoetIdNameTuples(data.geoImaginaryPoets, sappAlcPoetId);
}

/**
 * @param {IdNameTuple[]} array mutated in place
 * @param {number} poetId
 */
function putPoetIdAtEndOfPoetIdNameTuples(array, poetId) {
  /** @type {number | undefined} */
  let foundIdx;
  for (let idx = 0; idx < array.length; idx++) {
    if (array[idx][0] === poetId) {
      foundIdx = idx;
      break;
    }
  }
  if (foundIdx !== undefined) {
    const item = array[foundIdx];
    array.splice(foundIdx, 1);
    array.push(item);
  }
}

/** @param {Data} data */
function createTravelPoets(data) {
  // why do we omit these guys?
  const poetIdsToOmit = [
    29, // Oeniades
    38, // Aristonous
  ];

  const poetIds = new Set(
    data.lines
      .map(line => line.poetId)
      .filter(poetId => !poetIdsToOmit.includes(poetId))
  );
  data.travelPoets = createAlphabetizedListOfPoetsFromIds(poetIds, data);
}

/** @param {Data} data */
function createTravelCities(data) {
  const cityIds = new Set(
    data.lines.flatMap(line => [line.bornCityId, line.activeCityId])
  );
  /** @type {IdNameTuple[]} */
  const tuples = Array
    .from(cityIds)
    .map(cityId => [cityId, getCity(data, cityId).cityname]);
  data.travelCities = tuples.sort((a, b) => sortAlphabetically(a[1], b[1]));
}

/** @param {Data} data */
function createRegionsForInterface(data) {
  const regionIdsToOmit = [
    27, // Aeolis
    21, // Asia
    29, // Asia Minor islands
    13, // Cythera
    6, // Ionia
    10, // Italy
    33, // Macedonia
    16, // Mysia
    25, // Phoenicia
    23, // Phrygia
    24, // Scythia
    20, // Thrace
    28 // Troad
  ];
  /** @type {IdNameTuple[]} */
  const tuples = data.regions
    .filter(region => !regionIdsToOmit.includes(region.regionId))
    .map(region => [region.regionId, region.regionname]);
  data.regionsForInterface = tuples.sort((a, b) => sortAlphabetically(a[1], b[1]));
}

/**
 * Builds one travel line per (birthplace, place-of-activity) pair. Poets with
 * several attested birthplaces therefore yield several lines.
 * @param {Data} data
 */
function createLines(data) {
  /** @type {Record<number, { bornPcs: PoetCity[], activePcs: PoetCity[] }>} */
  const poets = {}
  for (const pc of data.poetCities) {
    if (!poets[pc.poetId]) poets[pc.poetId] = {
      bornPcs: [],
      activePcs: []
    }
    if (pc.relationshipId === 3 || pc.relationshipId === 2)
      poets[pc.poetId].activePcs.push(pc);
    else if (pc.relationshipId === 1)
      poets[pc.poetId].bornPcs.push(pc);
  }

  data.poetsWithUnknownTravel = [];
  data.lines = [];
  for (const poetIdStr in poets) {
    const poetId = parseInt(poetIdStr);
    const poet = poets[poetId];
    if (poet.bornPcs.length === 0 || poet.activePcs.length === 0) {
      const poet = getPoet(data, poetId);
      const poetDetailName = poet.poetDetailName
      data.poetsWithUnknownTravel.push([poetId, poetDetailName]);
    } else {
      for (const bornPc of poet.bornPcs) {
        for (const activePc of poet.activePcs) {
          const dotted = bornPc.dotted === "dotted" || activePc.dotted === "dotted";
          const fromCity = getCity(data, bornPc.cityId);
          const toCity = getCity(data, activePc.cityId);
          const poet = getPoet(data, poetId);
          const poetDates = data.datesByPoetId[poetId];
          const bornGovIds = [... new Set(
            getGovs(data, bornPc.cityId)
              .filter(gov => poetDates.includes(gov.date))
              .map(gov => gov.governmentId)
              .flatMap(govId => convertMixedGovIds(govId))
          )];
          const activeGovIds = [... new Set(
            getGovs(data, activePc.cityId)
              .filter(gov => poetDates.includes(gov.date))
              .map(gov => gov.governmentId)
              .flatMap(govId => convertMixedGovIds(govId))
          )];
          // The PoetPrimed fields are filled in by primeObjWithPoetData below.
          const line = /** @type {Line} */ ({
            poetId: poetId,
            bornCityId: bornPc.cityId,
            activeCityId: activePc.cityId,
            bornPc: bornPc,
            activePc: activePc,
            dotted: dotted,
            bornCity: fromCity,
            activeCity: toCity,
            poetDetailName: poet.poetDetailName,
            bornGovIds: bornGovIds,
            activeGovIds: activeGovIds
          });
          primeObjWithPoetData(line, data);
          data.lines.push(line);
        }
      }
    }
  }
  data.poetsWithUnknownTravel.sort((a, b) => sortAlphabetically(a[1], b[1]));
}

/**
 * Some gov ids correspond to two government types (e.g. Kingship/Tyranny ->
 * both kingship and tyranny); here we unpack these and include those types too.
 * @param {number} govId
 * @returns {number[]}
 */
function convertMixedGovIds(govId) {
  if (govId === 9) {
    return [9, 1, 2] // oligarchy/tyranny, oligarchy, tyranny
  } else if (govId === 10) {
    return [10, 1, 3] // oligarchy/democracy, oligarchy, democracy
  } else if (govId === 12) {
    return [12, 4, 2] // kingship/tyranny, kingship, tyranny
  } else return [govId];
}

/** @param {Data} data */
function keyLines(data) {
  data.linesByPoetId = {};
  for (const line of data.lines) {
    if (!data.linesByPoetId[line.poetId]) {
      data.linesByPoetId[line.poetId] = [];
    }
    data.linesByPoetId[line.poetId].push(line);
  }

  data.linesByBornCityId = {}
  for (const line of data.lines) {
    if (!data.linesByBornCityId[line.bornCityId]) {
      data.linesByBornCityId[line.bornCityId] = [];
    }
    data.linesByBornCityId[line.bornCityId].push(line);
  }

  data.linesByActiveCityId = {}
  for (const line of data.lines) {
    if (!data.linesByActiveCityId[line.activeCityId]) {
      data.linesByActiveCityId[line.activeCityId] = [];
    }
    data.linesByActiveCityId[line.activeCityId].push(line);
  }
}

/** @param {Data} data */
function createGenreIdsWithNames(data) {
  const genresToOmit = [
    "1", // Diaskeue
    "31" // Possibly lyric
  ]
  /** @type {[string, string][]} */
  const tuples = Object
    .keys(data.genresByGenreId)
    .map((id) => [id, data.genresByGenreId[Number(id)]]);
  data.genreIdsWithName = tuples
    .filter(kv => !genresToOmit.includes(kv[0]))
    .sort((a, b) => sortAlphabetically(a[1], b[1]));
}
