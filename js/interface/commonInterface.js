// The control bar is plain HTML built as strings, so a radio button's id is the
// only thing tying a click back to a filter. That id is `${prefix}_${num}`, and
// mapStateFrom() parses it back apart into the filter its map is showing.
//
// The prefix is therefore typed rather than a bare string: misspell one here and
// it stops compiling, instead of producing a button that alerts when clicked.
// Which prefixes each map is allowed to emit is checked by the control bar tests.

/**
 * Builds one control-bar radio button from a filter option.
 * @param {FilterOption} option
 * @param {MapFilterType} prefix
 * @returns {string}
 */
export function createInputFromOption(option, prefix) {
  return createFilterInput(prefix, option.id, option.name);
}

/**
 * Builds one control-bar radio button for a fixed filter, e.g. ("all", 1).
 * @param {MapFilterType} prefix
 * @param {number | string} num
 * @param {string} label
 * @returns {string}
 */
export function createFilterInput(prefix, num, label) {
  return createInput(`${prefix}_${num}`, label);
}

/**
 * @param {string} id
 * @param {string} label
 * @returns {string}
 */
function createInput(id, label) {
  return `
    <input type="radio" name="city" id="${id}" class="hiddenRadio">
    <label for="${id}" class="picker-label">${label}</label>
  `;
}
