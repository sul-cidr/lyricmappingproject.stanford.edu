import { TRAVEL_RED, TRAVEL_PURPLE, TRAVEL_YELLOW } from "../constants/colors.js";
import { drawBubbles } from "./bubbles.js";
import { getMapTypeNum, getCity, getGovs } from "../calcData/getters.js";
import { createTravelPopupHtml } from "./travelPopups.js";

export function calculateAndDrawLines(map, data, state) {
  const filteredPoetLines = filterLines(state, data);
  const calculatedLines = calculateLines(state, data, filteredPoetLines);
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
    return data.lines.filter(line =>
      line.bornCityid === num || line.activeCityid === num
    );
  } else if (type === "smallregion") {
    return data.lines.filter(line =>
      line.bornCity.regionid === num || line.activeCity.regionid === num
    );
  } else if (type === "region") {
    return data.lines.filter(line =>
      line.bornCity.bigRegionid === num || line.activeCity.bigRegionid === num
    );
  } else if (type === "gov") {
    return data.lines.filter(line => {
      const bornGovs = getGovs(data, line.bornCityid);
      const activeGovs = getGovs(data, line.activeCityid);
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
  const activeCityid = hash % 1000;
  return [fromCityid, activeCityid];
}

function calculateLines(state, data, filteredPoetLines) {
  const lines = {}
  for (const line of filteredPoetLines) {
    const hash = hashCityIds(line.bornCityid, line.activeCityid);
    if (!lines[hash]) {
      lines[hash] = {};
      lines[hash].fromCity = line.bornCity;
      lines[hash].toCity = line.activeCity;
      lines[hash].poetLines = [];
      lines[hash].dotted = false;
      lines[hash].color = TRAVEL_RED;
      lines[hash].name = (`${line.bornCity.infowindow_name} -> ${line.activeCity.infowindow_name}`).toUpperCase();
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
    if (line.fromCity.cityid === num) line.color = TRAVEL_PURPLE;
  } else if (type === "smallregion") {
    if (line.fromCity.regionid === num) line.color = TRAVEL_PURPLE;
  } else if (type === "region") {
    if (line.fromCity.bigRegionid === num) line.color = TRAVEL_PURPLE;
  } else if (type === "gov") {
    const bornGovs = getGovs(data, line.fromCity.cityid);
    const activeGovs = getGovs(data, line.toCity.cityid);
    if (bornGovs.has(num) && activeGovs.has(num)) line.color = TRAVEL_YELLOW;
    else if (bornGovs.has(num)) line.color = TRAVEL_PURPLE;
  }
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