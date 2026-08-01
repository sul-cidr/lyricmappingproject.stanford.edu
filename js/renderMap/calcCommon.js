import { getPoet } from "../calcData/getters.js";

/**
 * Builds a predicate keeping only rows whose poet was active within the date
 * range currently selected on the slider.
 * @param {Data} data
 * @param {State} state
 * @returns {(obj: { poetId: number }) => boolean}
 */
export function getDateFilterFn(data, state) {
  return obj => {
    const poet = getPoet(data, obj.poetId);
    return poet.maxDate >= state.minDate && poet.minDate <= state.maxDate;
  };
}
