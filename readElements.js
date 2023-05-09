var elements;

export function init(els) {
  elements = els;
}

export function getMass(symbol) { return elements[symbol].mass; }
export function getNumber(symbol) { return elements[symbol].number; }
export function getName(symbol) { return elements[symbol].name; }
export function getValence(symbol) {
  const shells = elements[symbol].shells;
  const tentativeValence = shells[shells.length-1];
  return (getGroup(symbol) == "Transition Metal" && tentativeValence != 1) ? 2 : tentativeValence;
}
export function getConfig(symbol) { return elements[symbol].electron_configuration; }
export function getGroup(symbol) { return elements[symbol].group; }