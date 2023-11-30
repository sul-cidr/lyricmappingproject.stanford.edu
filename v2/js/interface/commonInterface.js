export function createInputFromTuple(tuple, prefix) {
  return createInput(`${prefix}_${tuple[0]}`, tuple[1]);
}

export function createInput(id, label) {
  return (`
    <input type="radio" name="city" id="${id}" class="hiddenRadio">
    <label for="${id}" class="picker-label">${label}</label>           
  `);
}