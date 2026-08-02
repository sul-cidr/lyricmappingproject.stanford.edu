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
    // A poet the lookup cannot resolve has no dates, and a poet with no dates
    // is already invisible here whatever the slider says: this is the same
    // answer, given without reading fields off nothing.
    if (!poet) return false;
    return poet.maxDate >= state.minDate && poet.minDate <= state.maxDate;
  };
}
