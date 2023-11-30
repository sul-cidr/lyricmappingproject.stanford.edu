import { TRAVEL_RED } from "../constants/colors.js";
import { drawBubbles } from "./bubbles.js";
import { getMapTypeNum, getCity } from "../calcData/getters.js";

export function calculateAndDrawLines(map, data, state) {
  const filteredPoetLines = filterLines(state, data);
  const calculatedLines = calculateLines(data, filteredPoetLines);
  const travelBubbles = calculateTravelBubbles(data, filteredPoetLines);
  drawLines(map, calculatedLines);
  drawBubbles(map, travelBubbles);
}

function filterLines(state, data) {
  const [type, num] = getMapTypeNum(state);
  if (type === "all") {
    return data.lines;
  } else if (type === "poet") {
    return data.lines.filter(line => line.poetid === num);
  } else if (type === "destination") {
    return data.lines.filter(line => line.bornCityid === num || line.activeCityid === num);
  } else {
    alert(`unrecognized type of map in travel map: <b>${type}</b>`);
  }
}

function hashCityIds(from, to) {
  return from * 1000 + to;
}

function unhashCityIds(hash) {
  const fromCityid = Math.floor(hash / 1000);
  const activeCityid = hash % 1000;
  return [fromCityid, activeCityid];
}

function calculateLines(data, filteredPoetLines) {
  const lines = {}
  for (const line of filteredPoetLines) {
    const hash = hashCityIds(line.bornCityid, line.activeCityid);
    if (!lines[hash]) {
      lines[hash] = {};
      const fromCity = getCity(data, line.bornCityid);
      const toCity = getCity(data, line.activeCityid);
      lines[hash].fromCity = fromCity;
      lines[hash].toCity = toCity;
      lines[hash].poetLines = [];
      lines[hash].dotted = false;
    }
    lines[hash].poetLines.push(line);
    if (line.dotted) lines[hash].dotted = true;
  }
  return lines;
}

function calculateTravelBubbles(data, filteredPoetLines) {
  const cityIds = new Set()
  for (const plId in filteredPoetLines) {
    const pl = filteredPoetLines[plId];
    cityIds.add(pl.bornCityid);
    cityIds.add(pl.activeCityid);
  }

  const bubbles = {};
  for (const cityId of cityIds) {
    const city = data.citiesById[cityId];
    bubbles[cityId] = {};
    bubbles[cityId].city = city;
    bubbles[cityId].price = 10;
  }

  return bubbles;
}

function drawLines(map, calculatedLines) {
  for (const hash in calculatedLines) {
    const line = calculatedLines[hash];
    const fromCity = line.fromCity;
    const activeCity = line.toCity;
    const fromLatLng = L.latLng(fromCity.lat, fromCity.long);
    const toLatLng = L.latLng(activeCity.lat, activeCity.long);

    let dashArray;
    if (line.dotted) {
      dashArray = "8, 8";
    }
    const geodesic = L.geodesic([fromLatLng, toLatLng], { color: TRAVEL_RED, weight: 1, dashArray: dashArray });
    const decorator = L.polylineDecorator(geodesic, {
      patterns: [
        { offset: 25, repeat: 200, symbol: L.Symbol.arrowHead({ pathOptions: { color: TRAVEL_RED, fillOpacity: 1, weight: 0 } }) }
        // {
        //   symbol: L.Symbol.marker({
        //     rotate: true, markerOptions: {
        //       icon: L.icon({
        //         iconUrl: './assets/arrow-16.svg',
        //         iconSize: [10, 10]
        //       })
        //     }
        //   })
        // }
      ]
    });
    map.currentLayerGroup.addLayer(geodesic);
    map.currentLayerGroup.addLayer(decorator);
  }
}