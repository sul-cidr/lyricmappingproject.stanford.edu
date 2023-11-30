export function getPoet(data, poetId) {
  if (data.poetsById[poetId]) return data.poetsById[poetId];
  console.log(`poetId ${poetId} does not exist in poetsById`);
}

export function getGenres(data, poetId) {
  if (data.genresByPoetId[poetId]) return data.genresByPoetId[poetId];
  else return [];
}

export function getCity(data, cityId) {
  if (data.citiesById[cityId]) return data.citiesById[cityId];
  console.log(`cityId ${cityId} does not exist in citiesById`);
}

export function getMapTypeNum(state) {
  const [type, string_num] = state.selectedId.split("_");
  const num = parseInt(string_num);
  return [type, num];
}