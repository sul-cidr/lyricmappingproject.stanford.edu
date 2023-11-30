import { getGenres, getMapTypeNum, getPoet } from "../calcData/getters.js";

export function calcPoetCities(data, state) {
  const poetsCitiesData = getPoetsCitiesData(data, state)
  const filterFn = getFilterFn(data, state)
  const filteredPoetsCities = poetsCitiesData.filter(filterFn);

  const renderedPoetsCities = renderPoetsCities(filteredPoetsCities, data, state);

  return renderedPoetsCities;
}

function getPoetsCitiesData(data, state) {
  let poetsCitiesData;
  if (state.currentMapMode === "places_mode" || state.currentMapMode === "travel_mode") {
    poetsCitiesData = data.poetsCities;
  } else if (state.currentMapMode === "geo_imaginary_mode") {
    poetsCitiesData = data.geoPoetsCities;
  } else {
    alert(`unrecognized current map mode ${state.currentMapMode}`);
  }
  return [...poetsCitiesData];
}

function getFilterFn(data, state) {
  const [type, num] = getMapTypeNum(state);
  let filterFn;
  if (type === "all") {
    filterFn = () => true;
  }
  else if (type === "relationship") {
    if (num === 3) filterFn = () => true;
    else filterFn = poetCity => poetCity.relationshipid === num;
  }
  else if (type === "poet") {
    filterFn = poetCity => poetCity.poetid === num;
  }
  else if (type === "genre") {
    filterFn = poetCity => {
      return data.genresByPoetId[poetCity.poetid] &&
        data
          .genresByPoetId[poetCity.poetid]
          .map(genre => genre.genreid)
          .includes(num) &&
        poetCity.relationshipid === 1;
    }
  } else {
    alert(`${type} not recognized when trying to calculate poet cities`);
  }
  return filterFn;
}

function renderPoetsCities(filteredPoetsCities, data, state) {
  const [type, num] = getMapTypeNum(state);

  return filteredPoetsCities.map(pc => {
    const poet = getPoet(data, pc.poetid);

    let poetDetailsName = "";
    if (poet.details_name) poetDetailsName = poet.details_name;
    else alert(`Poet ${pc.poets_poet_name} with poetid ${pc.poetid} lacks a details name`);

    let poetDates = "";
    if (poet.dates) poetDates = poet.dates;
    else console.log(`Poet ${pc.poets_poet_name} with poetid ${pc.poetid} lacks dates`);

    let poetSources = "";
    if (poet.sources) poetSources = poet.sources;
    else console.log(`Poet ${pc.poets_poet_name} with poetid ${pc.poetid} lacks sources`);

    const genres = getGenres(data, pc.poetid);
    const poetsGenreNames = genres.map(genre => genre.genre).join(", ");

    const reference = {
      source_citation: pc.source_citation,
      source_greektext: pc.source_greektext,
      source_translation: pc.source_translation,
      source_translator: pc.source_translator
    }
    if (type === "genre") {
      const genrePoetCities = data
        .genresByPoetId[pc.poetid]
        .filter(genre => genre.genreid === num);
      if (genrePoetCities.length > 1) {
        console.log(`poet with name ${pc.poets_poet_name} and ${poetid} has more than one entry for genreid ${num}`);
      }
      if (genrePoetCities.length === 0) {
        console.log(`poet with name ${pc.poets_poet_name} and ${poetid} has no entries for genreid ${num} (though we filtered to this genreid)`);
      }
      const genrePoetCity = genrePoetCities[0];
      reference.source_citation = genrePoetCity.source_citation;
      reference.source_greektext = genrePoetCity.source_greektext;
      reference.source_translation = genrePoetCity.source_translation;
      reference.source_translator = genrePoetCity.source_translator;
    }

    const renderedPc = {
      poetid: pc.poetid,
      cityid: pc.cityid,
      poets_city_name: pc.poets_city_name,
      poets_poet_name: pc.poets_poet_name,
      poets_details_name: poetDetailsName,
      poets_dates: poetDates,
      poets_genres: poetsGenreNames,
      poets_sources: poetSources,
      relationshipid: pc.relationshipid,
      reference: reference
    };
    if (pc.source_poem) renderedPc.reference.source_poem = pc.source_poem;
    return renderedPc;
  });
}