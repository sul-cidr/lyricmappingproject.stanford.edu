import { updateMap } from "../renderMap/updateMap.js";

export function initializeSlider(map, data, state) {
  const slider = document.getElementById('slider');

  noUiSlider.create(slider, {
    start: [-800, -400],
    connect: true,
    range: {
      'min': -800,
      'max': -400
    },
    step: 50,
    tooltips: [
      { to: function (value) { return `${-1 * value} BCE`; } },
      { to: function (value) { return `${-1 * value} BCE`; } }
    ]
  });

  slider.noUiSlider.on("update", function (values) {
    const [minDate, maxDate] = values.map(value => parseInt(value));
    if (state.minDate !== minDate || state.maxDate !== maxDate) {
      [state.minDate, state.maxDate] = [minDate, maxDate];
      updateMap(map, data, state);
    }
  });
}