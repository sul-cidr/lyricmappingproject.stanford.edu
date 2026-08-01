import { sortAlphabetically } from "../calcData/data.js";
import { createPopupHtml } from "../popups/popups.js";

/**
 * Groups rendered rows by city into one bubble per city, sized by how many
 * poets it holds, and attaches each bubble's popup html.
 * @param {State} state
 * @param {Data} data
 * @param {RenderedPoetCity[]} poetCities
 * @returns {Record<number, Bubble>}
 */
export function calculateBubbles(state, data, poetCities) {
  const citiesById = data.citiesById;
  /** @type {Record<number, Bubble>} */
  const bubbles = {}

  for (const poetCity of poetCities) {
    const cityId = poetCity.cityId;
    if (cityId && citiesById[cityId]) {
      if (!bubbles[cityId]) {
        bubbles[cityId] = /** @type {Bubble} */ ({});
        bubbles[cityId].city = citiesById[cityId];
        bubbles[cityId].poetCities = [];
      }
      bubbles[cityId].poetCities.push(poetCity);
    }
  }

  if (state.currentMapMode === "geoimaginaryMode") {
    for (const cityId in bubbles) {
      const bubbleCity = bubbles[cityId];
      // poets starts life keyed by poetId so references can be accumulated,
      // then is flattened to the sorted array that popups consume.
      /** @type {Record<number, GeoBubblePoet>} */
      const poetsById = {};
      for (const pc of bubbleCity.poetCities) {
        if (!poetsById[pc.poetId]) {
          poetsById[pc.poetId] = /** @type {GeoBubblePoet} */ ({ ...pc });
          poetsById[pc.poetId].references = [];
        }
        poetsById[pc.poetId].references.push(pc.reference);
      }
      bubbleCity.poets = Object.values(poetsById);
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

/**
 * @param {number} numberOfPoets
 * @returns {number}
 */
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
