import { getPoet, getCity, getGenres, getGovs } from "./getters.js";

/**
 * Hydrates the raw CSV rows (ids and coordinates become numbers, dates become
 * negative years) and builds everything the map draws from.
 *
 * Assembled and returned rather than written into a bag the caller supplies.
 * The three stages below are a real dependency order — the lookups are
 * regroupings of the CSVs, and the travel lines and control bar lists are
 * derived through those lookups — so each is complete before the next reads it,
 * and no half-built Data is ever visible.
 * @param {RawCsvs} raw
 * @returns {Data}
 */
export function initializeData(raw) {
  const csvs = hydrate(raw);
  const lookups = createLookups(csvs);

  // Two passes that write back onto the CSV rows, because a row is what the
  // rest of the code passes around: a city gains its big region, a poet the
  // range of dates attested for them.
  addBigRegionIdToCities(csvs, lookups);
  addDatesToPoets(lookups);

  const derived = derive(csvs, lookups);

  // Assigned onto the rows, not built into them, which is the one place left
  // where a type runs ahead of the object it describes: until this line, a
  // PoetCity is missing the four PoetPrimed fields its type says it has.
  //
  // A travel line could be built complete because createLines() makes it. These
  // rows are made by Papa Parse and mutated in place ever since, and derive()
  // above has captured these exact objects as bornPc and activePc, so handing
  // back primed copies would leave those references pointing at the originals.
  //
  // Last, and in this order: createLines() reads poetCities in file order, so
  // sorting them any earlier would reorder the poets on every travel arc. The
  // "every row is primed with its poet's display data" test in
  // tests/initializeData.test.js is what holds the claim above together.
  for (const pc of [...csvs.poetCities, ...csvs.geopoetCities]) {
    Object.assign(pc, poetPrimedData(lookups, pc.poetId));
  }
  sortPoetCities(lookups, csvs.poetCities);
  sortPoetCities(lookups, csvs.geopoetCities);

  return { ...csvs, ...lookups, ...derived };
}

/**
 * Papa Parse hands back every field as a string. This parses the numeric ones in
 * place and hands the rows back under their hydrated types, which is the only
 * form the rest of the codebase ever sees.
 *
 * The one cast is that reinterpretation itself: these are the same objects,
 * described by RawCsvs going in and by Csvs coming out.
 * @param {RawCsvs} raw
 * @returns {Csvs}
 */
function hydrate(raw) {
  /** @type {Record<keyof RawCsvs, any[]>} */
  const rows = raw;

  rows.genres.forEach(genre => (genre.genreId = parseInt(genre.genreId)));
  rows.cities.forEach(city => (city.cityId = parseInt(city.cityId)));
  rows.cities.forEach(city => (city.regionId = parseInt(city.regionId)));
  rows.cities.forEach(city => (city.lat = parseFloat(city.lat)));
  rows.cities.forEach(city => (city.long = parseFloat(city.long)));
  rows.cityPolitics.forEach(city => (city.cityId = parseInt(city.cityId)));
  rows.cityPolitics.forEach(city => (city.governmentId = parseInt(city.governmentId)));
  rows.cityPolitics.forEach(cp => (cp.date = -1 * parseInt(cp.date)));
  rows.poetCities.forEach(poetCity => (poetCity.relationshipId = parseInt(poetCity.relationshipId)));
  rows.poetCities.forEach(poetCity => (poetCity.poetId = parseInt(poetCity.poetId)));
  rows.poetCities.forEach(poetCity => (poetCity.cityId = parseInt(poetCity.cityId)));
  rows.geopoetCities.forEach(poetCity => (poetCity.poetId = parseInt(poetCity.poetId)));
  rows.geopoetCities.forEach(poetCity => (poetCity.imaginaryid = parseInt(poetCity.imaginaryid)));
  rows.geopoetCities.forEach(poetCity => (poetCity.cityId = parseInt(poetCity.cityId)));
  rows.regions.forEach(region => (region.regionId = parseInt(region.regionId)));
  rows.regions.forEach(region => (region.bigRegionId = parseInt(region.bigRegionId)));
  rows.dates.forEach(date => {
    date.poetId = parseInt(date.poetId);
    date.date = -1 * parseInt(date.date);
  });
  rows.governments.forEach(gov => (gov.governmentId = parseInt(gov.governmentId)));

  return rows;
}

/**
 * The by-id regroupings of the CSVs. Each reads one CSV and nothing else, so
 * they are all built together, before anything that needs them.
 * @param {Csvs} csvs
 * @returns {Lookups}
 */
function createLookups(csvs) {
  return {
    citiesById: keyById(csvs.cities, city => city.cityId),
    poetsById: keyById(csvs.poets, poet => poet.poetId),
    regionsById: keyById(csvs.regions, region => region.regionId),
    genresByPoetId: groupById(csvs.genres, genre => genre.poetId, identity),
    genresByGenreId: createGenresByGenreId(csvs.genres),
    govsByCityId: groupById(csvs.cityPolitics, cityPolitics => cityPolitics.cityId, identity),
    govsById: keyById(
      csvs.governments,
      gov => gov.governmentId,
      gov => gov.government
    ),
    datesByPoetId: groupById(
      csvs.dates,
      date => date.poetId,
      date => date.date
    )
  };
}

/**
 * The travel lines and the control bar lists. Built in the order they were
 * before, so that anything they report about bad data is still reported in the
 * same order.
 * @param {Csvs} csvs
 * @param {Lookups} lookups
 * @returns {Derived}
 */
function derive(csvs, lookups) {
  const genreIdsWithName = createGenreIdsWithNames(lookups);
  const geoImaginaryPoets = createGeoImaginaryPoets(csvs, lookups);
  const { lines, poetsWithUnknownTravel } = createLines(csvs, lookups);

  return {
    genreIdsWithName,
    geoImaginaryPoets,
    lines,
    poetsWithUnknownTravel,
    linesByPoetId: groupById(lines, line => line.poetId, identity),
    linesByBornCityId: groupById(lines, line => line.bornCityId, identity),
    linesByActiveCityId: groupById(lines, line => line.activeCityId, identity),
    travelPoets: createTravelPoets(lines, lookups),
    travelCities: createTravelCities(lines, lookups),
    regionsForInterface: createRegionsForInterface(csvs)
  };
}

/**
 * @template T
 * @param {T} value
 * @returns {T}
 */
function identity(value) {
  return value;
}

/**
 * The last row wins, as it did when these were written out one loop at a time.
 * @template T, V
 * @param {T[]} rows
 * @param {(row: T) => number} idOf
 * @param {(row: T) => V} [valueOf] defaults to the row itself
 * @returns {Record<number, V>}
 */
function keyById(rows, idOf, valueOf) {
  /** @type {Record<number, V>} */
  const byId = {};
  for (const row of rows) {
    byId[idOf(row)] = valueOf ? valueOf(row) : /** @type {any} */ (row);
  }
  return byId;
}

/**
 * @template T, V
 * @param {T[]} rows
 * @param {(row: T) => number} idOf
 * @param {(row: T) => V} valueOf
 * @returns {Record<number, V[]>}
 */
function groupById(rows, idOf, valueOf) {
  /** @type {Record<number, V[]>} */
  const byId = {};
  for (const row of rows) {
    const id = idOf(row);
    if (!byId[id]) byId[id] = [];
    byId[id].push(valueOf(row));
  }
  return byId;
}

/**
 * @param {Lookups} lookups
 * @param {(PoetCity | GeoPoetCity)[]} poetCities mutated in place
 */
function sortPoetCities(lookups, poetCities) {
  poetCities.sort((a, b) => {
    const poetA = getPoet(lookups, a.poetId);
    const poetB = getPoet(lookups, b.poetId);
    return sortAlphabetically(poetA.poetname, poetB.poetname);
  });
}

/**
 * A poet's display name, dates, sources and genres, to be copied onto a row (or
 * a travel line) so popups can render without a second lookup.
 *
 * Returned rather than assigned, so a travel line can be built with these fields
 * already on it instead of existing briefly without them.
 * @param {Lookups} lookups
 * @param {number} poetId
 * @returns {PoetPrimed}
 */
function poetPrimedData(lookups, poetId) {
  const poet = getPoet(lookups, poetId);

  let poetDetailName = "";
  if (poet.poetDetailName) poetDetailName = poet.poetDetailName;
  else alert(`Poet ${poet.poetname} with poetId ${poetId} lacks a details name`);

  let poetDates = "";
  if (poet.dates) poetDates = poet.dates;
  else console.log(`Poet ${poet.poetname} with poetId ${poetId} lacks dates`);

  let poetSources = "";
  if (poet.sources) poetSources = poet.sources;
  else console.log(`Poet ${poet.poetname} with poetId ${poetId} lacks sources`);

  return {
    poetDetailName,
    poetDates,
    poetSources,
    poetGenres: getGenres(lookups, poetId)
      .map(genre => genre.genre)
      .join(", ")
  };
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

/**
 * @param {Csvs} csvs cities are mutated in place
 * @param {Lookups} lookups
 */
function addBigRegionIdToCities(csvs, lookups) {
  for (const city of csvs.cities) {
    if (city.regionId && lookups.regionsById[city.regionId] && lookups.regionsById[city.regionId].bigRegionId) {
      city.bigRegionId = lookups.regionsById[city.regionId].bigRegionId;
    }
  }
}

/**
 * @param {Lookups} lookups poets are mutated in place
 */
function addDatesToPoets(lookups) {
  for (const poetIdStr in lookups.datesByPoetId) {
    const poetId = Number(poetIdStr);
    const poet = getPoet(lookups, poetId);
    if (poet) {
      poet.minDate = Math.min(...lookups.datesByPoetId[poetId]);
      poet.maxDate = Math.max(...lookups.datesByPoetId[poetId]);
    }
  }
}

/**
 * @param {Genre[]} genres
 * @returns {Record<number, string>}
 */
function createGenresByGenreId(genres) {
  /** @type {Record<number, string>} */
  const genresByGenreId = {};
  for (const genre of genres) {
    const genreName = genre.genre;
    if (!genresByGenreId[genre.genreId]) {
      genresByGenreId[genre.genreId] = genreName;
    } else {
      const existingGenreName = genresByGenreId[genre.genreId];
      if (genreName !== existingGenreName) {
        console.log(
          `${genreName} has genreId ${genre.genreId} but does not match existing ${existingGenreName}. Source translation: "${genre.source_translation}"`
        );
      }
    }
  }
  return genresByGenreId;
}

/**
 * @param {Iterable<number>} poetIds
 * @param {Lookups} lookups
 * @returns {FilterOption[]}
 */
function createAlphabetizedListOfPoetsFromIds(poetIds, lookups) {
  return Array.from(poetIds)
    .map(poetId => ({ id: poetId, name: getPoet(lookups, poetId).poetDetailName }))
    .sort((a, b) => sortAlphabetically(a.name, b.name));
}

/**
 * @param {Csvs} csvs
 * @param {Lookups} lookups
 * @returns {FilterOption[]}
 */
function createGeoImaginaryPoets(csvs, lookups) {
  const poetIdsToOmit = [
    151, // Aristotle
    33, // Castorion
    4, // Cinesias
    100, // Bacchylides
    149 // Pindar
  ];

  const poetIds = new Set(csvs.geopoetCities.map(pc => pc.poetId).filter(poetId => !poetIdsToOmit.includes(poetId)));

  const geoImaginaryPoets = createAlphabetizedListOfPoetsFromIds(poetIds, lookups);

  // put sappho / alcaeus at end of array
  const sappAlcPoetId = 157;
  putPoetIdAtEnd(geoImaginaryPoets, sappAlcPoetId);
  return geoImaginaryPoets;
}

/**
 * @param {FilterOption[]} array mutated in place
 * @param {number} poetId
 */
function putPoetIdAtEnd(array, poetId) {
  /** @type {number | undefined} */
  let foundIdx;
  for (let idx = 0; idx < array.length; idx++) {
    if (array[idx].id === poetId) {
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

/**
 * @param {Line[]} lines
 * @param {Lookups} lookups
 * @returns {FilterOption[]}
 */
function createTravelPoets(lines, lookups) {
  // why do we omit these guys?
  const poetIdsToOmit = [
    29, // Oeniades
    38 // Aristonous
  ];

  const poetIds = new Set(lines.map(line => line.poetId).filter(poetId => !poetIdsToOmit.includes(poetId)));
  return createAlphabetizedListOfPoetsFromIds(poetIds, lookups);
}

/**
 * @param {Line[]} lines
 * @param {Lookups} lookups
 * @returns {FilterOption[]}
 */
function createTravelCities(lines, lookups) {
  const cityIds = new Set(lines.flatMap(line => [line.bornCityId, line.activeCityId]));
  return Array.from(cityIds)
    .map(cityId => ({ id: cityId, name: getCity(lookups, cityId).cityname }))
    .sort((a, b) => sortAlphabetically(a.name, b.name));
}

/**
 * @param {Csvs} csvs
 * @returns {FilterOption[]}
 */
function createRegionsForInterface(csvs) {
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
  return csvs.regions
    .filter(region => !regionIdsToOmit.includes(region.regionId))
    .map(region => ({ id: region.regionId, name: region.regionname }))
    .sort((a, b) => sortAlphabetically(a.name, b.name));
}

/**
 * Builds one travel line per (birthplace, place-of-activity) pair. Poets with
 * several attested birthplaces therefore yield several lines. Poets with a
 * birthplace but nowhere to go are handed back separately, for the places
 * control bar to list.
 * @param {Csvs} csvs
 * @param {Lookups} lookups
 * @returns {{ lines: Line[], poetsWithUnknownTravel: FilterOption[] }}
 */
function createLines(csvs, lookups) {
  /** @type {Record<number, { bornPcs: PoetCity[], activePcs: PoetCity[] }>} */
  const poets = {};
  for (const pc of csvs.poetCities) {
    if (!poets[pc.poetId])
      poets[pc.poetId] = {
        bornPcs: [],
        activePcs: []
      };
    if (pc.relationshipId === 3 || pc.relationshipId === 2) poets[pc.poetId].activePcs.push(pc);
    else if (pc.relationshipId === 1) poets[pc.poetId].bornPcs.push(pc);
  }

  /** @type {FilterOption[]} */
  const poetsWithUnknownTravel = [];
  /** @type {Line[]} */
  const lines = [];
  for (const poetIdStr in poets) {
    const poetId = parseInt(poetIdStr);
    const poet = poets[poetId];
    if (poet.bornPcs.length === 0 || poet.activePcs.length === 0) {
      const poetDetailName = getPoet(lookups, poetId).poetDetailName;
      poetsWithUnknownTravel.push({ id: poetId, name: poetDetailName });
    } else {
      for (const bornPc of poet.bornPcs) {
        for (const activePc of poet.activePcs) {
          const dotted = bornPc.dotted === "dotted" || activePc.dotted === "dotted";
          const fromCity = getCity(lookups, bornPc.cityId);
          const toCity = getCity(lookups, activePc.cityId);
          const poetDates = lookups.datesByPoetId[poetId];
          const bornGovIds = [
            ...new Set(
              getGovs(lookups, bornPc.cityId)
                .filter(gov => poetDates.includes(gov.date))
                .map(gov => gov.governmentId)
                .flatMap(govId => convertMixedGovIds(govId))
            )
          ];
          const activeGovIds = [
            ...new Set(
              getGovs(lookups, activePc.cityId)
                .filter(gov => poetDates.includes(gov.date))
                .map(gov => gov.governmentId)
                .flatMap(govId => convertMixedGovIds(govId))
            )
          ];
          /** @type {Line} */
          const line = {
            poetId: poetId,
            bornCityId: bornPc.cityId,
            activeCityId: activePc.cityId,
            bornPc: bornPc,
            activePc: activePc,
            dotted: dotted,
            bornCity: fromCity,
            activeCity: toCity,
            bornGovIds: bornGovIds,
            activeGovIds: activeGovIds,
            ...poetPrimedData(lookups, poetId)
          };
          lines.push(line);
        }
      }
    }
  }
  poetsWithUnknownTravel.sort((a, b) => sortAlphabetically(a.name, b.name));
  return { lines, poetsWithUnknownTravel };
}

/**
 * Some gov ids correspond to two government types (e.g. Kingship/Tyranny ->
 * both kingship and tyranny); here we unpack these and include those types too.
 * @param {number} govId
 * @returns {number[]}
 */
function convertMixedGovIds(govId) {
  if (govId === 9) {
    return [9, 1, 2]; // oligarchy/tyranny, oligarchy, tyranny
  } else if (govId === 10) {
    return [10, 1, 3]; // oligarchy/democracy, oligarchy, democracy
  } else if (govId === 12) {
    return [12, 4, 2]; // kingship/tyranny, kingship, tyranny
  } else return [govId];
}

/**
 * @param {Lookups} lookups
 * @returns {FilterOption[]}
 */
function createGenreIdsWithNames(lookups) {
  const genresToOmit = [
    1, // Diaskeue
    31 // Possibly lyric
  ];
  return Object.keys(lookups.genresByGenreId)
    .map(id => ({ id: Number(id), name: lookups.genresByGenreId[Number(id)] }))
    .filter(genre => !genresToOmit.includes(genre.id))
    .sort((a, b) => sortAlphabetically(a.name, b.name));
}
