import { getTextWidth } from "./textWidth.js";

var dragging = null;

var draggables = {};
var draggableHeritage = {};

var draggableIds = 0;
var topZ = 0;

document.body.addEventListener("mousemove", (e) => {
  if (dragging) { dragging.doDrag(e); }
});

document.body.addEventListener("mouseup", (e) => {
  if (dragging) { 
    dragging.doDrag(e);
    dragging = null;
  }
});

export class Draggable {
  constructor({
    allDrag = false,
    title = "",
    spawn = "root",
    width = 100,
    height = 100,
    align = "center"
  }) {
    this.pos = { "x":0, "y":0 };
    this.d_pos = { "x":0, "y":0 };

    this.el = document.createElement("div");
    this.el.classList.add("draggables");
    
    this.el.style.width = `${width}px`;
    this.el.style.height = `${height + 20}px`;

    const header = document.createElement("div");
    header.classList.add("draggable-headers");
    
    const titleEl = document.createElement("div");
    titleEl.classList.add("draggable-titles");
    titleEl.setAttribute("title", title);
    titleEl.innerText = title;
    titleEl.style.textAlign = align;

    // ensure that title fits in box
    const max = 16;
    const min = 8;
    for (let i = max; i >= min; i--) {
      if (i == min || getTextWidth(title, "Roboto Slab", i) <= width) {
        titleEl.style.fontSize = `${i}px`;
        titleEl.style.paddingTop = `${(max-i)/2}px`; // center vertically

        break;
      }
    }

    const deleteEl = document.createElement("div");
    deleteEl.classList.add("draggable-deletes");
    deleteEl.setAttribute("title", "Delete");

    const minimizeEl = document.createElement("div");
    minimizeEl.classList.add("draggable-minimizes");
    minimizeEl.setAttribute("title", "Minimize");

    this.content = document.createElement("div");
    this.content.classList.add("draggable-contents");

    header.append(titleEl);
    header.append(minimizeEl);
    header.append(deleteEl);

    this.el.append(header);
    this.el.append(this.content);
    
    if (allDrag) {
      this.el.addEventListener("mousedown", this.startDrag.bind(this));
      this.el.classList.add("drag-regions");
    }
    else {
      header.addEventListener("mousedown", this.startDrag.bind(this));
      header.classList.add("drag-regions");
      this.el.addEventListener("mousedown",  this.bringToTop.bind(this));
    }

    // don't all buttons to be dragged
    minimizeEl.addEventListener("mousedown", (e) => { e.stopPropagation(); });
    deleteEl.addEventListener("mousedown", (e) => { e.stopPropagation(); });

    deleteEl.addEventListener("click", this.remove.bind(this));
    minimizeEl.addEventListener("click", this.minimize.bind(this, minimizeEl));

    this.id = draggableIds++; 
    draggables[this.id] = this;
    if (!(spawn in draggableHeritage)) draggableHeritage[spawn] = [];
    draggableHeritage[spawn].push(this.id);
    
    this.spawn = spawn;
  }

  startDrag(e) {
    this.d_pos.x = e.pageX - this.pos.x;
    this.d_pos.y = e.pageY - this.pos.y;
    dragging = this;
    this.bringToTop();
  }
  doDrag(e) {
    this.pos.x = e.pageX - this.d_pos.x;
    this.pos.y = e.pageY - this.d_pos.y;

    this.el.style.left = `${this.pos.x}px`;
    this.el.style.top = `${this.pos.y}px`;
  }
  bringToTop() {
    if (this.el.style.zIndex == "" || this.el.style.zIndex != topZ.toString()) this.el.style.zIndex = ++topZ;
  }

  setPos(x,y) {
    this.pos.x = x;
    this.pos.y = y;
    this.el.style.left = `${this.pos.x}px`;
    this.el.style.top = `${this.pos.y}px`;
  }

  remove() {
    this.el.remove();
    delete draggables[this.id];
    const index = draggableHeritage[this.spawn].indexOf(this.id);
    if (index != -1) draggableHeritage[this.spawn].splice(this.id, 1);
    if (draggableHeritage[this.spawn].length == 0) delete draggableHeritage[this.spawn]; // no children, therefore no need to store
  }
  minimize(minimizer) {
    if (minimizer.getAttribute("maximize")) { // do maximize
      minimizer.removeAttribute("maximize");
      this.el.classList.remove("minimized");
    }
    else { // do minimize
      minimizer.setAttribute("maximize", "1");
      this.el.classList.add("minimized");
    }
  }
}

export class LargeElement extends Draggable {
  constructor({
    name,
    symbol,
    number,
    mass,
    valence,
    state,
    config,
    color
  }) {
    super({
      allDrag: false,
      title: name,
      width: 100,
      height: 100
    });

    const symbolEl = document.createElement("div");
    symbolEl.classList.add("large-element-symbols");
    symbolEl.classList.add("large-element-children");
    symbolEl.innerText = symbol;

    const numberEl = document.createElement("div");
    numberEl.classList.add("large-element-numbers");
    numberEl.classList.add("large-element-children");
    numberEl.innerText = number;

    
    const massEl = document.createElement("div");
    massEl.classList.add("large-element-masses");
    massEl.classList.add("large-element-children");
    massEl.innerText = formatFloat(mass, 4);

    const valenceEls = [];
    const posXConvert = [ -0.6, -0.2, 0, 0.2, 0.6 ];
    const posYConvert = [ -23, -8, 0, 8, 23 ];
    const xScale = Math.max(30, getTextWidth(symbol, "Roboto Slab", 40));
    for (let pos of lewisStructurePos[valence-1]) {
      const valenceEl = document.createElement("div");
      valenceEl.classList.add("large-element-lewis-dots");
      valenceEl.classList.add("large-element-children");
      valenceEl.style.left = `calc(50% + ${posXConvert[pos.x]*xScale}px)`;
      valenceEl.style.top = `calc(50% + ${posYConvert[pos.y]}px)`;
      valenceEls.push(valenceEl);
    }

    const configEl = document.createElement("div");
    configEl.classList.add("large-element-configurations");
    configEl.classList.add("large-element-children");
    const configPattern = /^(\[.+\])|((\d+)(\D)(\d+))$/;
    for (const term of config.split(" ")) {
      const match = term.match(configPattern);

      const termEl = document.createElement("div");
      termEl.classList.add("large-element-configuration-terms");

      if (match[1]) {
        const noble = document.createElement("div");
        noble.classList.add("large-element-configuration-nobles");
        noble.innerText = match[1];
        termEl.append(noble);
      }
      else {
        const shell = document.createElement("div");
        shell.classList.add("large-element-configuration-shells");
        shell.innerText = match[3];

        const subshell = document.createElement("div");
        subshell.classList.add("large-element-configuration-subshells");
        subshell.innerText = match[4];

        const index = document.createElement("div");
        index.classList.add("large-element-configuration-indicies");
        index.innerText = match[5];

        termEl.append(shell);
        termEl.append(subshell);
        termEl.append(index);
      }

      configEl.append(termEl);
    }

    this.content.style.backgroundColor = color;

    this.content.append(symbolEl);
    this.content.append(numberEl);
    this.content.append(massEl);
    valenceEls.forEach(valenceEl => { this.content.append(valenceEl); });
    this.content.append(configEl);
  }
}

const lewisStructurePos = [
  [
    { "x":4, "y":2 }
  ],
  [
    { "x":4, "y":2 },
    { "x":2, "y":0 }
  ],
  [
    { "x":4, "y":2 },
    { "x":2, "y":0 },
    { "x":0, "y":2 }
  ],
  [
    { "x":4, "y":2 },
    { "x":2, "y":0 },
    { "x":0, "y":2 },
    { "x":2, "y":4 }
  ],
  [
    { "x":4, "y":1 },
    { "x":4, "y":3 },
    { "x":2, "y":0 },
    { "x":0, "y":2 },
    { "x":2, "y":4 }
  ],
  [
    { "x":4, "y":1 },
    { "x":4, "y":3 },
    { "x":1, "y":0 },
    { "x":3, "y":0 },
    { "x":0, "y":2 },
    { "x":2, "y":4 }
  ],
  [
    { "x":4, "y":1 },
    { "x":4, "y":3 },
    { "x":1, "y":0 },
    { "x":3, "y":0 },
    { "x":0, "y":1 },
    { "x":0, "y":3 },
    { "x":2, "y":4 }
  ],
  [
    { "x":4, "y":1 },
    { "x":4, "y":3 },
    { "x":1, "y":0 },
    { "x":3, "y":0 },
    { "x":0, "y":1 },
    { "x":0, "y":3 },
    { "x":1, "y":4 },
    { "x":3, "y":4 }
  ]
]

function formatFloat(num, len) {
  num = num.toString();
  const decimal = num.indexOf(".");

  if (decimal == -1) { // integer
    num += ".";
    while (num.length < len) {
      num += "0";
    }
    return num;
  }
  else { // decimal
    if (num.length > len) { // round and truncate
      const shift = 10**(len-decimal-1);
      num = (Math.round((+num) * shift) / shift).toString();

      if (num.indexOf(".") == -1) num += "."; // rounds to an integer
    }
    while (num.length < len) { // add '0's until full
      num += "0";
    }
    return num;
  }
}