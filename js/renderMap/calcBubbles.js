import { sortAlphabetically } from "../calcData/data.js";
import { createPopupHtml } from "../popups/popups.js";

export function calculateBubbles(state, data, poetCities) {
  const citiesById = data.citiesById;
  const bubbles = {}

  for (const poetCity of poetCities) {
    const cityId = poetCity.cityId;
    if (cityId && citiesById[cityId]) {
      if (!bubbles[cityId]) {
        bubbles[cityId] = {};
        bubbles[cityId].city = citiesById[cityId];
        bubbles[cityId].poetCities = [];
      }
      bubbles[cityId].poetCities.push(poetCity);
    }
  }

  if (state.currentMapMode === "geoimaginaryMode") {
    for (const cityId in bubbles) {
      const bubbleCity = bubbles[cityId];
      if (!bubbleCity.poets) bubbleCity.poets = {}
      for (const pc of bubbleCity.poetCities) {
        if (!bubbleCity.poets[pc.poetId]) {
          bubbleCity.poets[pc.poetId] = { ...pc };
          bubbleCity.poets[pc.poetId].references = [];
        }
        bubbleCity.poets[pc.poetId].references.push(pc.reference);
      }
      bubbleCity.poets = Object.values(bubbleCity.poets);
      bubbleCity.poets.sort((a, b) => sortAlphabetically(a.poetname, b.poetname));
    }
  }

  for (const cityId in bubbles) {
    const bubble = bubbles[cityId];
    bubble.price = calculateBubblePriceFromNumberOfPoets(bubble.poetCities.length);
    bubble.popupHtml = createPopupHtml(state, data, bubble);
    bubble.legend = bubble.city.cityname;
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