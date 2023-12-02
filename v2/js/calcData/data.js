import { getPoet, getCity, getGenres } from "./getters.js";

export function initializeData(data) {
  data.genres.forEach(genre => genre.genreid = parseInt(genre.genreid));
  data.cities.forEach(city => city.cityId = parseInt(city.cityId));
  data.cities.forEach(city => city.regionId = parseInt(city.regionId));
  data.cityPolitics.forEach(city => city.cityId = parseInt(city.cityId));
  data.cityPolitics.forEach(city => city.governmentid = parseInt(city.governmentid));
  data.poetCities.forEach(poetCity => poetCity.relationshipid = parseInt(poetCity.relationshipid));
  data.poetCities.forEach(poetCity => poetCity.poetId = parseInt(poetCity.poetId));
  data.poetCities.forEach(poetCity => poetCity.cityId = parseInt(poetCity.cityId));
  data.geopoetCities.forEach(poetCity => poetCity.poetId = parseInt(poetCity.poetId));
  data.geopoetCities.forEach(poetCity => poetCity.imaginaryid = parseInt(poetCity.imaginaryid));
  data.geopoetCities.forEach(poetCity => poetCity.cityId = parseInt(poetCity.cityId));
  data.regions.forEach(region => region.regionId = parseInt(region.regionId));
  data.regions.forEach(region => region.bigRegionId = parseInt(region.bigRegionId));

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
  createGovsByCityId(data);
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
}

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

export function sortAlphabetically(a, b) {
  if (a < b) { return -1; }
  if (a > b) { return 1; }
  return 0;
}

function createGovsByCityId(data) {
  data.govsByCityId = {};
  for (const cp of data.cityPolitics) {
    if (!data.govsByCityId[cp.cityId]) data.govsByCityId[cp.cityId] = new Set();
    data.govsByCityId[cp.cityId].add(cp.governmentid);
  }
}

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

function createGenresByGenreId(data) {
  data.genresByGenreId = {}
  for (const genre of data.genres) {
    const genreName = genre.genre;
    if (!data.genresByGenreId[genre.genreid]) {
      data.genresByGenreId[genre.genreid] = genreName;
    }
    else {
      const existingGenreName = data.genresByGenreId[genre.genreid];
      if (genreName !== existingGenreName) {
        console.log(`${genreName} has genreid ${genre.genreid} but does not match existing ${existingGenreName}. Source translation: "${genre.source_translation}"`);
      }
    }
  }
}

function createAlphabetizedListOfPoetsFromIds(poetIds, data) {
  return Array
    .from(poetIds)
    .map(poetId => {
      const poet = getPoet(data, poetId);
      const poetDetailName = poet.poetDetailName;
      return [poetId, poetDetailName];
    })
    .sort((a, b) => sortAlphabetically(a[1], b[1]));
}

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

function putPoetIdAtEndOfPoetIdNameTuples(array, poetId) {
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

  const esIdx = 18; // -es
  putPoetIdAtEndOfPoetIdNameTuples(data.travelPoets, esIdx);
}

function createTravelCities(data) {
  const cityIds = new Set(
    data.lines.flatMap(line => [line.bornCityId, line.activeCityId])
  );
  data.travelCities = Array
    .from(cityIds)
    .map(cityId => {
      const city = getCity(data, cityId);
      return [cityId, city.cityname];
    })
    .sort((a, b) => sortAlphabetically(a[1], b[1]));
}

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
  data.regionsForInterface = data.regions
    .filter(region => !regionIdsToOmit.includes(region.regionId))
    .map(region => [region.regionId, region.regionname])
    .sort((a, b) => sortAlphabetically(a[1], b[1]));
}

function createLines(data) {
  const poets = {}
  for (const pc of data.poetCities) {
    if (!poets[pc.poetId]) poets[pc.poetId] = {
      bornPcs: [],
      activePcs: []
    }
    if (pc.relationshipid === 3 || pc.relationshipid === 2)
      poets[pc.poetId].activePcs.push(pc);
    else if (pc.relationshipid === 1)
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
          const line = {
            poetId: poetId,
            bornCityId: bornPc.cityId,
            activeCityId: activePc.cityId,
            bornPc: bornPc,
            activePc: activePc,
            dotted: dotted,
            bornCity: fromCity,
            activeCity: toCity,
            poetDetailName: poet.poetDetailName
          };
          primeObjWithPoetData(line, data);
          data.lines.push(line);
        }
      }
    }
  }
  data.poetsWithUnknownTravel.sort((a, b) => sortAlphabetically(a[1], b[1]));
}

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

function createGenreIdsWithNames(data) {
  const genresToOmit = [
    "1", // Diaskeue
    "31" // Possibly lyric
  ]
  data.genreIdsWithName =
    Object
      .keys(data.genresByGenreId)
      .map((id) => [id, data.genresByGenreId[id]])
      .filter(kv => !genresToOmit.includes(kv[0]))
      .sort((a, b) => sortAlphabetically(a[1], b[1]));
}