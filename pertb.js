const $ = document.querySelector.bind(document);

import * as menus from "./menus.js";
import * as elInfo from "./readElements.js";

var elements = {};
var layout = null;
var styles = null;
var links = {};

var size;
var hoverSize;
var columnSize;

{
  const properties = getComputedStyle(document.documentElement);
  size = parseInt(properties.getPropertyValue("--size").replace("px", ""));
  hoverSize = parseInt(properties.getPropertyValue("--hover-size").replace("px", ""));
  columnSize = parseInt(properties.getPropertyValue("--column-size").replace("px", ""));

  const elementFetch = fetch("elements.json").then(res => res.json())
  const tableFetch = fetch("table.json").then(res => res.json())
  
  menus.init(elInfo);

  Promise.allSettled([
    elementFetch,
    tableFetch
  ]).then((res) => {
    elements = res[0].value;
    layout = res[1].value.layout;
    styles = res[1].value.style;

    elInfo.init(elements);

    for (let link of res[1].value.links) {
      for (let el1 of link) {
        links[el1] = [];
        for (let el2 of link) {
          links[el1].push(el2);
        }
      }
    }
    constructTable();
  })
}


function constructTable() {
  const offset = constructMainland();
  constructIslands(offset + 0.3);

  setTableBounds();
}

function setTableBounds() {
  let maxW = 0;
  let maxH = 0;
  for (const child of $("#table").children) {
    const bounds = child.getBoundingClientRect();
    maxW = Math.max(maxW, bounds.left + bounds.width);
    maxH = Math.max(maxH, bounds.top + bounds.height);
  }

  maxW -= $("#table").offsetLeft;
  maxH -= $("#table").offsetTop;

  $("#table").style.width = `${maxW}px`;
  $("#table").style.height = `${maxH}px`;
  $("#table").classList.add("actives");
}

// mainland considered anything within normal numbering scheme /[1-18]/
function constructMainland() {
  let maxHeight = 0;
  let families = [];
  let i = 1;
  while (i in layout) {
    const family = document.createElement("div");
    family.classList.add("table-columns");
    family.setAttribute("data-family", i.toString());
    family.style.left = `${((i-1)*columnSize)}px`;
    
    const els = generateVerticalElements(layout[i]);
    for (const el of els) { family.append(el); };
    maxHeight = Math.max(maxHeight, els.length);
    
    $("#table").append(family);
    families.push(family);
    i++;
  }

  for (let family of families) {
    family.style.height = `${maxHeight * (hoverSize + 1*size)/2 - (hoverSize - size)/2}px`
  }

  return maxHeight;
}

// island considered anything not in standard group notation /[^1-18]/
function constructIslands(offset) {
  let maxWidth = 0;
  let families = [];
  let localOffset = 0;
  for (const group in layout) {
    if (isNaN(group)) {
      const [family, width] = constructIsland(group);
      family.style.top = `${offset * (hoverSize + size)/2 + (hoverSize - size)/2 + localOffset*columnSize}px`;
      family.style.left = `${(layout[group].start-1)*columnSize}px`;

      $("#table").append(family);
      
      maxWidth = Math.max(maxWidth, width);
      families.push(family);
      localOffset++;
    }
  }

  for (let family of families) {
    family.style.width = `${maxWidth*columnSize - 10}px`
  }

  return localOffset;
}

function constructIsland(group) {
  const family = document.createElement("div");
  family.classList.add("island-rows");
  family.setAttribute("data-family", group);
  
  const els = generateHorizontalElements(layout[group]);
  for (const el of els) { family.append(el); }
  
  return [family, els.length];
}

function generateVerticalElements(familyData) {
  let elements = [];
  const offset = familyData.start-1;
  for (let i in familyData.series) {
    const element = generateElement( familyData.series[i] );
    element.style.top = `${(offset + +i) * (hoverSize + size)/2 + (hoverSize - size)/2}px`;

    elements.push(element);
  }
  return elements;
}

function generateHorizontalElements(familyData) {
  let elements = [];
  for (let i in familyData.series) {
    const element = generateElement( familyData.series[i] );
    element.style.left = `${i*columnSize + (hoverSize - size)/2}px`;

    elements.push(element);
  }
  return elements;
}

function generateElement(symbol) {
  const element = document.createElement("div");
  element.classList.add("elements");
  element.setAttribute("id", `el-${symbol}`);
  element.setAttribute("data-group", elements[symbol].group);

  const main = document.createElement("div");
  main.classList.add("element-mains");
  main.innerText = symbol;
  
  const topLeft = document.createElement("div");
  topLeft.classList.add("element-top-lefts");

  const midBottom = document.createElement("div");
  midBottom.classList.add("element-mid-bottoms");

  element.append(main);
  element.append(topLeft);
  element.append(midBottom);

  if (symbol in elements) {
    element.style.backgroundColor = styles[elements[symbol].group].color;
    topLeft.innerText = elements[symbol].number;
    midBottom.innerText = elements[symbol].name;
  }
  else {
    element.style.backgroundColor = styles.unknown.color;
    topLeft.innerText = "?";
    midBottom.innerText = "Unknown";
  }

  element.addEventListener("click", elementClicked);
  element.addEventListener("mouseenter", elementStartHover);
  element.addEventListener("mouseleave", elementEndHover);

  return element;
}

// for now, just copies to clipboard
function elementClicked() {
  const id = this.getAttribute("id").replace(/^el-/, "");
  const element = elements[id];

  const el = menus.buildLargeElement({
    color: styles[element.group].color,
    mass: element.mass,
    name: element.name,
    number: element.number,
    symbol: id,
    config: element.electron_configuration,
    state: element.state,
    valence: element.shells[element.shells.length-1]
  });
  
  if (el.isNew) {
    $("#draggables-container").append(el.el);
    
    const elPosInfo = this.getBoundingClientRect();
    el.setPos(
      elPosInfo.left + elPosInfo.width,
      elPosInfo.top
    );
  }
}

function elementStartHover() {
  const group = this.getAttribute("data-group");
  const els = document.querySelectorAll(getSelector(group));
  for (const el of els) {
    el.classList.add("actives");
  }
}

function elementEndHover() {
  const group = this.getAttribute("data-group");
  const els = document.querySelectorAll(getSelector(group));
  for (const el of els) {
    el.classList.remove("actives");
  }
}

function getSelector(group) {
  if (group in links) {
    let groups = [];
    for (let linkedGroup of links[group]) {
      groups.push(`[data-group=\"${linkedGroup}\"]`);
    }
    return groups.join(", ");
  }
  return `[data-group=\"${group}\"]`;
}
