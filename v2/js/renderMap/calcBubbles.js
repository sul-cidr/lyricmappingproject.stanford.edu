import { sortAlphabetically } from "../calcData/data.js";
import { createPopupHtml } from "./popups.js";

export function calculateBubbles(state, data, poetsCities) {
  const citiesById = data.citiesById;
  const bubbles = {}

  for (const poetCity of poetsCities) {
    const cityid = poetCity.cityid;
    if (cityid && citiesById[cityid]) {
      if (!bubbles[cityid]) {
        bubbles[cityid] = {};
        bubbles[cityid].city = citiesById[cityid];
        bubbles[cityid].poetCities = [];
      }
      bubbles[cityid].poetCities.push(poetCity);
    }
  }

  if (state.currentMapMode === "geo_imaginary_mode") {
    for (const cityid in bubbles) {
      const bubbleCity = bubbles[cityid];
      if (!bubbleCity.poets) bubbleCity.poets = {}
      for (const pc of bubbleCity.poetCities) {
        if (!bubbleCity.poets[pc.poetid]) {
          bubbleCity.poets[pc.poetid] = { ...pc };
          bubbleCity.poets[pc.poetid].references = [];
        }
        bubbleCity.poets[pc.poetid].references.push(pc.reference);
      }
      bubbleCity.poetsList = [];
      for (const poetId in bubbleCity.poets) {
        const poet = bubbleCity.poets[poetId];
        bubbleCity.poetsList.push([poet.poets_details_name, poet.references, poet]);
      }
      bubbleCity.poetsList.sort((a, b) => sortAlphabetically(a[0], b[0]));
    }
  }

  for (const cityid in bubbles) {
    const bubble = bubbles[cityid];
    bubble.price = calculateBubblePriceFromNumberOfPoets(bubble.poetCities.length);
    bubble.popupHtml = createPopupHtml(state, data, bubble);
    bubble.legend = bubble.city.city_name;
  }

  return bubbles;
}

function calculateBubblePriceFromNumberOfPoets(numberOfPoets) {
  if (numberOfPoets <= 1) return 10.0;
  if (numberOfPoets <= 2) return 13.3;
  if (numberOfPoets <= 3) return 15.0;
  if (numberOfPoets <= 4) return 16.7;
  if (numberOfPoets <= 6) return 18.3;
  if (numberOfPoets <= 8) return 21.7;
  if (numberOfPoets <= 15) return 25.0;
  return 28.0;
}