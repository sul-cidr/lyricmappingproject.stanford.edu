import { getPoet } from "../calcData/getters.js";

export function getDateFilterFn(data, state) {
  return (obj) => {
    const poet = getPoet(data, obj.poetId);
    return poet.maxDate >= state.minDate && poet.minDate <= state.maxDate;
  };
}