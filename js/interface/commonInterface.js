/**
 * Builds one control-bar radio button from an [id, label] pair. The prefix and
 * id are joined to form state.selectedId, e.g. "poet_93".
 * @param {[number | string, string]} tuple
 * @param {string} prefix
 * @returns {string}
 */
export function createInputFromTuple(tuple, prefix) {
  return createInput(`${prefix}_${tuple[0]}`, tuple[1]);
}

/**
 * @param {string} id
 * @param {string} label
 * @returns {string}
 */
export function createInput(id, label) {
  return (`
    <input type="radio" name="city" id="${id}" class="hiddenRadio">
    <label for="${id}" class="picker-label">${label}</label>
  `);
}
