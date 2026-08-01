import { updateMap } from "../renderMap/updateMap.js";

/**
 * Wires up the date range slider (values are negative years, i.e. BCE) and
 * redraws the map whenever it moves.
 * @param {LyricMap} map
 * @param {Data} data
 * @param {State} state
 */
export function initializeSlider(map, data, state) {
  const slider = /** @type {any} */ (document.getElementById('slider'));

  noUiSlider.create(slider, {
    start: [-800, -400],
    connect: true,
    range: {
      'min': -800,
      'max': -400
    },
    step: 50,
    tooltips: [
      { to: function (/** @type {number} */ value) { return `${-1 * value} BCE`; } },
      { to: function (/** @type {number} */ value) { return `${-1 * value} BCE`; } }
    ],
    // following from https://github.com/leongersen/noUiSlider/issues/1223
    handleAttributes: [
      { 'aria-label': 'lower' },
      { 'aria-label': 'upper' },
    ]
  });

  slider.noUiSlider.on("update", function (/** @type {string[]} */ values) {
    const [minDate, maxDate] = values.map(value => parseInt(value));
    if (state.minDate !== minDate || state.maxDate !== maxDate) {
      [state.minDate, state.maxDate] = [minDate, maxDate];
      updateMap(map, data, state);
    }
  });
}
