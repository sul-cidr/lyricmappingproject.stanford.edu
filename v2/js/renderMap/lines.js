import { TRAVEL_RED, TRAVEL_PURPLE, TRAVEL_YELLOW } from "../constants/colors.js";
import { drawBubblesAndLegends } from "./bubbles.js";
import { getMapTypeNum, getCity, getGovs } from "../calcData/getters.js";
import { createTravelPopupHtml } from "./travelPopups.js";

export function calculateAndDrawLines(map, data, state) {
  const filteredPoetLines = filterLines(state, data);
  const calculatedLines = calculateLines(state, data, filteredPoetLines);
  const travelBubbles = calculateTravelBubbles(data, filteredPoetLines);
  drawLines(map, calculatedLines);
  drawBubblesAndLegends(map, travelBubbles);
}

function filterLines(state, data) {
  const [type, num] = getMapTypeNum(state);
  if (type === "all") {
    return data.lines;
  } else if (type === "poet") {
    return data.lines.filter(line => line.poetId === num);
  } else if (type === "destination") {
    return data.lines.filter(line =>
      line.bornCityId === num || line.activeCityId === num
    );
  } else if (type === "smallregion") {
    return data.lines.filter(line =>
      line.bornCity.regionId === num || line.activeCity.regionId === num
    );
  } else if (type === "region") {
    return data.lines.filter(line =>
      line.bornCity.bigRegionId === num || line.activeCity.bigRegionId === num
    );
  } else if (type === "gov") {
    return data.lines.filter(line => {
      const bornGovs = getGovs(data, line.bornCityId);
      const activeGovs = getGovs(data, line.activeCityId);
      return bornGovs.has(num) || activeGovs.has(num);
    });
  }
  else {
    alert(`unrecognized type of map in travel map: <b>${type}</b>`);
  }
}

function hashCityIds(from, to) {
  return from * 1000 + to;
}

function unhashCityIds(hash) {
  const fromCityid = Math.floor(hash / 1000);
  const activeCityId = hash % 1000;
  return [fromCityid, activeCityId];
}

function calculateLines(state, data, filteredPoetLines) {
  const lines = {}
  for (const line of filteredPoetLines) {
    const hash = hashCityIds(line.bornCityId, line.activeCityId);
    if (!lines[hash]) {
      lines[hash] = {};
      lines[hash].fromCity = line.bornCity;
      lines[hash].toCity = line.activeCity;
      lines[hash].poetLines = [];
      lines[hash].dotted = false;
      lines[hash].color = TRAVEL_RED;
      lines[hash].name = (`${line.bornCity.infowindowName} -> ${line.activeCity.infowindowName}`).toUpperCase();
    }
    lines[hash].poetLines.push(line);
    colorLine(state, data, lines[hash], line);
    if (line.dotted) lines[hash].dotted = true;
  }
  for (const hash in lines) {
    const line = lines[hash];
    weightLine(state, line);
    line.popupHtml = createTravelPopupHtml(state, data, line);
  }
  return lines;
}

function weightLine(state, line) {
  const [type, num] = getMapTypeNum(state);
  const poetsNum = line.poetLines.length;
  let multiplier = 1;
  let increment = 0;
  if (type === "destination" || type === "smallregion" || type === "poet") {
    multiplier = 2;
    increment = 1;
  }
  line.weight = multiplier * poetsNum + increment;
}

function colorLine(state, data, line) {
  const [type, num] = getMapTypeNum(state);
  // default color is red
  if (type === "destination") {
    if (line.fromCity.cityId === num) line.color = TRAVEL_PURPLE;
  } else if (type === "smallregion") {
    if (line.fromCity.regionId === num) line.color = TRAVEL_PURPLE;
  } else if (type === "region") {
    if (line.fromCity.bigRegionId === num) line.color = TRAVEL_PURPLE;
  } else if (type === "gov") {
    const bornGovs = getGovs(data, line.fromCity.cityId);
    const activeGovs = getGovs(data, line.toCity.cityId);
    if (bornGovs.has(num) && activeGovs.has(num)) line.color = TRAVEL_YELLOW;
    else if (bornGovs.has(num)) line.color = TRAVEL_PURPLE;
  }
}

function calculateTravelBubbles(data, filteredPoetLines) {
  const cityIds = new Set()
  for (const plId in filteredPoetLines) {
    const pl = filteredPoetLines[plId];
    cityIds.add(pl.bornCityId);
    cityIds.add(pl.activeCityId);
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
    const geodesic = L.geodesic([fromLatLng, toLatLng], { color: line.color, weight: line.weight, dashArray: dashArray });
    if (line.popupHtml)
      geodesic.bindPopup(line.popupHtml);
    geodesic.bindTooltip(line.name);
    const decorator = L.polylineDecorator(geodesic, {
      patterns: [
        { offset: 10, repeat: 200, symbol: L.Symbol.arrowHead({ pathOptions: { color: line.color, fillOpacity: 1, weight: 0 } }) }
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