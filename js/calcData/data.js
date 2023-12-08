import { getPoet, getCity, getGenres, getGovs } from "./getters.js";

export function initializeData(data) {
  data.genres.forEach(genre => genre.genreId = parseInt(genre.genreId));
  data.cities.forEach(city => city.cityId = parseInt(city.cityId));
  data.cities.forEach(city => city.regionId = parseInt(city.regionId));
  data.cities.forEach(city => city.lat = parseFloat(city.lat));
  data.cities.forEach(city => city.long = parseFloat(city.long));
  data.cityPolitics.forEach(city => city.cityId = parseInt(city.cityId));
  data.cityPolitics.forEach(city => city.governmentId = parseInt(city.governmentId));
  data.cityPolitics.forEach(cp => cp.date = -1 * parseInt(cp.date));
  data.poetCities.forEach(poetCity => poetCity.relationshipId = parseInt(poetCity.relationshipId));
  data.poetCities.forEach(poetCity => poetCity.poetId = parseInt(poetCity.poetId));
  data.poetCities.forEach(poetCity => poetCity.cityId = parseInt(poetCity.cityId));
  data.geopoetCities.forEach(poetCity => poetCity.poetId = parseInt(poetCity.poetId));
  data.geopoetCities.forEach(poetCity => poetCity.imaginaryid = parseInt(poetCity.imaginaryid));
  data.geopoetCities.forEach(poetCity => poetCity.cityId = parseInt(poetCity.cityId));
  data.regions.forEach(region => region.regionId = parseInt(region.regionId));
  data.regions.forEach(region => region.bigRegionId = parseInt(region.bigRegionId));
  data.dates.forEach(date => {
    date.poetId = parseInt(date.poetId);
    date.date = -1 * parseInt(date.date);
  })
  data.governments.forEach(gov => gov.governmentId = parseInt(gov.governmentId));

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
    if (!data.govsByCityId[cp.cityId]) data.govsByCityId[cp.cityId] = [];
    data.govsByCityId[cp.cityId].push(cp);
  }
}

function createGovsById(data) {
  data.govsById = {};
  for (const gov of data.governments) {
    data.govsById[gov.governmentId] = gov.government;
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

function addDatesToPoets(data) {
  data.datesByPoetId = {};
  for (const date of data.dates) {
    if (!data.datesByPoetId[date.poetId]) data.datesByPoetId[date.poetId] = [];
    data.datesByPoetId[date.poetId].push(date.date);
  }
  for (const poetId in data.datesByPoetId) {
    const poet = getPoet(data, poetId);
    if (poet) {
      poet.minDate = Math.min(...data.datesByPoetId[poetId]);
      poet.maxDate = Math.max(...data.datesByPoetId[poetId]);
    }
  }
}

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
          const line = {
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
          };
          primeObjWithPoetData(line, data);
          data.lines.push(line);
        }
      }
    }
  }
  data.poetsWithUnknownTravel.sort((a, b) => sortAlphabetically(a[1], b[1]));
}

function convertMixedGovIds(govId) {
  // some gov ids correspond to two government types (e.g. Kingship/Tyranny -> both kingship and tyranny)
  // here we unpack these and include those types as well
  if (govId === 9) {
    return [9,1,2] // oligarchy/tyranny, oligarchy, tyranny
  } else if (govId === 10) {
    return [10,1,3] // oligarchy/democracy, oligarchy, democracy
  } else if (govId === 12) {
    return [12,4,2] // kingship/tyranny, kingship, tyranny
  } else return [govId];
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