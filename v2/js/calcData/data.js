import { getPoet } from "./getters.js";

export function initializeData(data) {
  // some datacleaning from csv parse
  data.genres.forEach(genre => genre.genreid = parseInt(genre.genreid));
  data.cities.forEach(city => city.cityid = parseInt(city.cityid));
  data.poetsCities.forEach(poetCity => poetCity.relationshipid = parseInt(poetCity.relationshipid));
  data.poetsCities.forEach(poetCity => poetCity.poetid = parseInt(poetCity.poetid));
  data.poetsCities.forEach(poetCity => poetCity.cityid = parseInt(poetCity.cityid));
  data.geoPoetsCities.forEach(poetCity => poetCity.poetid = parseInt(poetCity.poetid));
  data.geoPoetsCities.forEach(poetCity => poetCity.imaginaryid = parseInt(poetCity.imaginaryid));
  data.geoPoetsCities.forEach(poetCity => poetCity.cityid = parseInt(poetCity.cityid));

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
  createGenresByGenreId(data);
  createGenreIdsWithNames(data);
  createGeoImaginaryPoets(data);
  createLines(data);
  keyLines(data);
}

export function sortAlphabetically(a, b) {
  if (a < b) { return -1; }
  if (a > b) { return 1; }
  return 0;
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
          data.lines.push({
            poetid: poetId,
            bornCityid: bornPc.cityid,
            activeCityid: activePc.cityid,
            bornPc: bornPc,
            activePc: activePc,
            dotted: dotted
          });
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