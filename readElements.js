var elements;

export function init(els) {
  elements = els;
}

export function getMass(symbol) { return elements[symbol].mass; }
export function getNumber(symbol) { return elements[symbol].number; }
export function getName(symbol) { return elements[symbol].name; }
export function getValence(symbol) {
  const shells = elements[symbol].shells;
  return shells[shells.length-1];
}
export function getConfig(symbol) { return elements[symbol].electron_configuration; }
