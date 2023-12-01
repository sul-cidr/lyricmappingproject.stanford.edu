import { getPoet, getCity, getGenres } from "./getters.js";

export function initializeData(data) {
  // some datacleaning from csv parse
  data.genres.forEach(genre => genre.genreid = parseInt(genre.genreid));
  data.cities.forEach(city => city.cityid = parseInt(city.cityid));
  data.cities.forEach(city => city.regionid = parseInt(city.regionid));
  data.cityPolitics.forEach(city => city.cityid = parseInt(city.cityid));
  data.cityPolitics.forEach(city => city.governmentid = parseInt(city.governmentid));
  data.poetsCities.forEach(poetCity => poetCity.relationshipid = parseInt(poetCity.relationshipid));
  data.poetsCities.forEach(poetCity => poetCity.poetid = parseInt(poetCity.poetid));
  data.poetsCities.forEach(poetCity => poetCity.cityid = parseInt(poetCity.cityid));
  data.geoPoetsCities.forEach(poetCity => poetCity.poetid = parseInt(poetCity.poetid));
  data.geoPoetsCities.forEach(poetCity => poetCity.imaginaryid = parseInt(poetCity.imaginaryid));
  data.geoPoetsCities.forEach(poetCity => poetCity.cityid = parseInt(poetCity.cityid));

  // add big regionid to cities
  addBigRegionIdToCities(data);

  // create useful maps by key
  data.citiesById = {}
  for (const city of data.cities) {
    data.citiesById[city.cityid] = city;
  }
  data.poetsById = {}
  for (const poet of data.poets) {
    data.poetsById[poet.poetid] = poet;
  }
  data.genresByPoetId = {}
  for (const genre of data.genres) {
    if (!data.genresByPoetId[genre.poetid]) {
      data.genresByPoetId[genre.poetid] = [];
    }
    data.genresByPoetId[genre.poetid].push(genre);
  }
  createGovsByCityId(data);
  createGenresByGenreId(data);
  createGenreIdsWithNames(data);
  createGeoImaginaryPoets(data);
  createLines(data);
  keyLines(data);
  primePoetCities(data);
}

function primePoetCities(data) {
  data.poetsCities.forEach(pc => {
    primeObjWithPoetData(pc, data);
  });
}

function primeObjWithPoetData(obj, data) {
  const poet = getPoet(data, obj.poetid);

  obj.poetsDetailsName = "";
  if (poet.details_name) obj.poetsDetailsName = poet.details_name;
  else alert(`Poet ${obj.poets_poet_name} with poetid ${obj.poetid} lacks a details name`);

  obj.poetsDates = "";
  if (poet.dates) obj.poetsDates = poet.dates;
  else console.log(`Poet ${obj.poets_poet_name} with poetid ${obj.poetid} lacks dates`);

  obj.poetsSources = "";
  if (poet.sources) obj.poetsSources = poet.sources;
  else console.log(`Poet ${obj.poets_poet_name} with poetid ${obj.poetid} lacks sources`);

  const genres = getGenres(data, obj.poetid);
  obj.poetsGenreNames = genres.map(genre => genre.genre).join(", ");
}

export function sortAlphabetically(a, b) {
  if (a < b) { return -1; }
  if (a > b) { return 1; }
  return 0;
}

function createGovsByCityId(data) {
  data.govsByCityId = {};
  for (const cp of data.cityPolitics) {
    if (!data.govsByCityId[cp.cityid]) data.govsByCityId[cp.cityid] = new Set();
    data.govsByCityId[cp.cityid].add(cp.governmentid);
  }
}

function addBigRegionIdToCities(data) {
  const magnaGraeciaId = 1;
  const magnaGraecia = [
    7, // Sicily
    10 // Italy
  ];
  const mainlandGreeceId = 2;
  const mainlandGreece = [
    22, // Euboea
    20, // Thrace
    12, // Thessaly
    11, // Northern Greece
    2, // Attica
    3, // Boeotia
    4, // Central Greece
    9//, // Peloponnese
    // 33 // Macedonia
  ];
  const aegeanIslandsId = 3;
  const aegeanIsland = [
    1, // Cyclades
    8, // Lesbos
    15, // Dodecanese
    17, // Crete
    13, // Cythera
    29 // Asia Minor islands
  ];
  const asiaMinorId = 4;
  const asiaMinor = [
    26, // doesn't exist?
    23, // Phrygia
    6, // Ionia
    14, // Lydia
    16, // Mysia
    28, // Troad
    27 // Aeolis
  ];
  const unAssigned = [
    19, // Ionian Sea
    13, // Cythera
    18, // Cyprus
    21, // Asia
    25, // Phoenicia
    24, // Scythia
    33 // Macedonia
  ]
  for (const city of data.cities) {
    if (city.regionid) {
      if (magnaGraecia.includes(city.regionid))
        city.bigRegionid = magnaGraeciaId;
      else if (mainlandGreece.includes(city.regionid))
        city.bigRegionid = mainlandGreeceId;
      else if (aegeanIsland.includes(city.regionid))
        city.bigRegionid = aegeanIslandsId;
      else if (asiaMinor.includes(city.regionid))
        city.bigRegionid = asiaMinorId;
      else if (unAssigned.includes(city.regionid)) { }
      else {
        console.log(`city ${city.city_name} with id ${city.cityid} has unknown regionid ${city.regionid} with name ${city.region}`);
      }
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

function createGeoImaginaryPoets(data) {
  const poetIdsToOmit = [
    151, // Aristotle
    33,  // Castorion
    4,   // Cinesias
    100, // Bacchylides
    149  // Pindar
  ]

  const poetIds = new Set();
  for (const pc of data.geoPoetsCities) {
    if (!poetIdsToOmit.includes(pc.poetid))
      poetIds.add(pc.poetid);
  }

  data.geoImaginaryPoets = [];
  for (const poetId of poetIds) {
    const poet = getPoet(data, poetId);
    const poetDetailsName = poet.details_name
    data.geoImaginaryPoets.push([poetId, poetDetailsName]);
  }
  data.geoImaginaryPoets.sort((a, b) => sortAlphabetically(a[1], b[1]));

  // put sappho / alcaeus at end of array
  let sappAlcIdx;
  const sappAlcPoetId = 157;
  for (let idx = 0; idx < data.geoImaginaryPoets.length; idx++) {
    if (data.geoImaginaryPoets[idx][0] === sappAlcPoetId) {
      sappAlcIdx = idx;
      break;
    }
  }
  if (sappAlcIdx) {
    const sapphoAlcaeus = data.geoImaginaryPoets[sappAlcIdx];
    data.geoImaginaryPoets.splice(sappAlcIdx, 1);
    data.geoImaginaryPoets.push(sapphoAlcaeus);
  }
}

function createLines(data) {
  const poets = {}
  for (const pc of data.poetsCities) {
    if (!poets[pc.poetid]) poets[pc.poetid] = {
      bornPcs: [],
      activePcs: []
    }
    if (pc.relationshipid === 3 || pc.relationshipid === 2)
      poets[pc.poetid].activePcs.push(pc);
    else if (pc.relationshipid === 1)
      poets[pc.poetid].bornPcs.push(pc);
  }

  data.poetsWithUnknownTravel = [];
  data.lines = [];
  for (const poetIdStr in poets) {
    const poetId = parseInt(poetIdStr);
    const poet = poets[poetId];
    if (poet.bornPcs.length === 0 || poet.activePcs.length === 0) {
      const poet = getPoet(data, poetId);
      const poetDetailsName = poet.details_name
      data.poetsWithUnknownTravel.push([poetId, poetDetailsName]);
    } else {
      for (const bornPc of poet.bornPcs) {
        for (const activePc of poet.activePcs) {
          const dotted = bornPc.dotted === "dotted" || activePc.dotted === "dotted";
          const fromCity = getCity(data, bornPc.cityid);
          const toCity = getCity(data, activePc.cityid);
          const poet = getPoet(data, poetId);
          const line = {
            poetid: poetId,
            bornCityid: bornPc.cityid,
            activeCityid: activePc.cityid,
            bornPc: bornPc,
            activePc: activePc,
            dotted: dotted,
            bornCity: fromCity,
            activeCity: toCity,
            poets_details_name: poet.details_name
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
    if (!data.linesByPoetId[line.poetid]) {
      data.linesByPoetId[line.poetid] = [];
    }
    data.linesByPoetId[line.poetid].push(line);
  }

  data.linesByBornCityId = {}
  for (const line of data.lines) {
    if (!data.linesByBornCityId[line.bornCityid]) {
      data.linesByBornCityId[line.bornCityid] = [];
    }
    data.linesByBornCityId[line.bornCityid].push(line);
  }

  data.linesByActiveCityId = {}
  for (const line of data.lines) {
    if (!data.linesByActiveCityId[line.activeCityid]) {
      data.linesByActiveCityId[line.activeCityid] = [];
    }
    data.linesByActiveCityId[line.activeCityid].push(line);
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