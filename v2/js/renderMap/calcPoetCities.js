import { getGenres, getMapTypeNum, getPoet } from "../calcData/getters.js";

export function calcPoetCities(data, state) {
  const poetCitiesData = getpoetCitiesData(data, state);
  const filterFn = getFilterFn(data, state);
  const filteredpoetCities = poetCitiesData.filter(filterFn);

  const renderedpoetCities = renderpoetCities(filteredpoetCities, data, state);

  return renderedpoetCities;
}

function getpoetCitiesData(data, state) {
  let poetCitiesData;
  if (state.currentMapMode === "placesMode" || state.currentMapMode === "travelMode") {
    poetCitiesData = data.poetCities;
  } else if (state.currentMapMode === "geoimaginaryMode") {
    poetCitiesData = data.geopoetCities;
  } else {
    alert(`unrecognized current map mode ${state.currentMapMode}`);
  }
  return [...poetCitiesData];
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
    filterFn = poetCity => poetCity.poetId === num;
  }
  else if (type === "genre") {
    filterFn = poetCity => {
      return data.genresByPoetId[poetCity.poetId] &&
        data
          .genresByPoetId[poetCity.poetId]
          .map(genre => genre.genreid)
          .includes(num) &&
        poetCity.relationshipid === 1;
    }
  } else {
    alert(`${type} not recognized when trying to calculate poet cities`);
  }
  return filterFn;
}

function renderpoetCities(filteredpoetCities, data, state) {
  const [type, num] = getMapTypeNum(state);

  return filteredpoetCities.map(pc => {
    const reference = {
      source_citation: pc.source_citation,
      source_greektext: pc.source_greektext,
      source_translation: pc.source_translation,
      source_translator: pc.source_translator
    }
    if (type === "genre") {
      const genrePoetCities = data
        .genresByPoetId[pc.poetId]
        .filter(genre => genre.genreid === num);
      if (genrePoetCities.length > 1) {
        console.log(`poet with name ${pc.poetname} and ${poetId} has more than one entry for genreid ${num}`);
      }
      if (genrePoetCities.length === 0) {
        console.log(`poet with name ${pc.poetname} and ${poetId} has no entries for genreid ${num} (though we filtered to this genreid)`);
      }
      const genrePoetCity = genrePoetCities[0];
      reference.source_citation = genrePoetCity.source_citation;
      reference.source_greektext = genrePoetCity.source_greektext;
      reference.source_translation = genrePoetCity.source_translation;
      reference.source_translator = genrePoetCity.source_translator;
    }

    const renderedPc = {
      poetId: pc.poetId,
      cityId: pc.cityId,
      cityname: pc.cityname,
      poetname: pc.poetname,
      poetDetailName: pc.poetDetailName,
      poetDates: pc.poetDates,
      poetGenres: pc.poetGenres,
      poetSources: pc.poetSources,
      relationshipid: pc.relationshipid,
      reference: reference
    };
    if (pc.source_poem) renderedPc.reference.source_poem = pc.source_poem;
    return renderedPc;
  });
}