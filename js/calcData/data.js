import { getPoet, getCity, getGovs } from "./getters.js";

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

  // What used to be the priming pass: the four display strings were copied onto
  // every poet-city row and travel line here, and these warnings fired as a side
  // effect of the copy. Popups now look the poet up when they render, so all
  // that is left is the check — which is what it always really was.
  warnAboutIncompletePoets(csvs, lookups);

  // createLines() reads poetCities in file order, so sorting any earlier would
  // reorder the poets on every travel arc.
  sortPoetCities(lookups, csvs.poetCities);
  sortPoetCities(lookups, csvs.geopoetCities);

  return { ...csvs, ...lookups, ...derived };
}

/**
 * Every field Papa Parse hands back as a string that is not one.
 *
 * The three marked below were missing when this was a flat list of forEach
 * calls, so a Poet held the string "149" where its type promised a number. It
 * went unnoticed for as long as it did because an id is only ever used as an
 * object key, and poetsById["149"] and poetsById[149] are the same key — until
 * something compares one with ===.
 * @type {NumericCsvFields}
 */
export const NUMERIC_CSV_FIELDS = {
  regions: { int: ["regionId", "bigRegionId"] },
  cities: { int: ["cityId", "regionId"], float: ["lat", "long"] },
  poetCities: { int: ["poetId", "cityId"], optionalInt: ["relationshipId"] },
  poets: { int: ["poetId"] }, // was missing
  genres: { int: ["poetId", "genreId"] }, // poetId was missing
  geopoetCities: { int: ["poetId", "cityId", "imaginaryid"] },
  cityPolitics: { int: ["cityId", "governmentId"], bce: ["date"] },
  bigRegions: { int: ["regionId"] }, // the whole table was missing
  dates: { int: ["poetId"], bce: ["date"] },
  governments: { int: ["governmentId"] }
};

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

  for (const table of /** @type {(keyof RawCsvs)[]} */ (Object.keys(NUMERIC_CSV_FIELDS))) {
    const fields = NUMERIC_CSV_FIELDS[table];
    for (const row of rows[table]) {
      for (const field of fields.int ?? []) row[field] = parseInt(row[field]);
      for (const field of fields.optionalInt ?? []) {
        const parsed = parseInt(row[field]);
        if (Number.isNaN(parsed)) delete row[field];
        else row[field] = parsed;
      }
      for (const field of fields.float ?? []) row[field] = parseFloat(row[field]);
      for (const field of fields.bce ?? []) row[field] = -1 * parseInt(row[field]);
    }
  }

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
    citiesById: keyById(csvs.cities, city => city.cityId, identity),
    poetsById: keyById(csvs.poets, poet => poet.poetId, identity),
    regionsById: keyById(csvs.regions, region => region.regionId, identity),
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
 * @param {(row: T) => V} valueOf pass identity to key the rows themselves
 * @returns {Record<number, V>}
 */
function keyById(rows, idOf, valueOf) {
  /** @type {Record<number, V>} */
  const byId = {};
  for (const row of rows) {
    byId[idOf(row)] = valueOf(row);
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
 * Reports poets that are on the map but missing the display data popups show.
 *
 * Reported once per poet rather than once per row, which is what the priming
 * pass did — a poet with five rows alerted five times. Reporting it here rather
 * than where popups read it keeps it to startup: at render time the same alert
 * would fire again on every redraw.
 * @param {Csvs} csvs
 * @param {Lookups} lookups
 */
function warnAboutIncompletePoets(csvs, lookups) {
  const poetIds = new Set([...csvs.poetCities, ...csvs.geopoetCities].map(pc => pc.poetId));
  for (const poetId of poetIds) {
    const poet = getPoet(lookups, poetId);
    // getPoet has already logged the missing id; there is nothing more to say.
    if (!poet) continue;
    if (!poet.poetDetailName) alert(`Poet ${poet.poetname} with poetId ${poetId} lacks a details name`);
    if (!poet.dates) console.log(`Poet ${poet.poetname} with poetId ${poetId} lacks dates`);
    if (!poet.sources) console.log(`Poet ${poet.poetname} with poetId ${poetId} lacks sources`);
  }
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
            activeGovIds: activeGovIds
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
