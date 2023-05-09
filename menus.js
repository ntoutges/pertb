import { getTextWidth } from "./textWidth.js";
var elInfo;

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

export function init(readElementsLib) {
  elInfo = readElementsLib;
}

export function getDraggable(type, id) {
  const identifier = Draggable.getIdentifier(id, type);
  return (identifier in draggables) ? draggables[identifier] : null;
}

class Draggable {
  constructor({
    allDrag = false,
    title = "",
    spawn = "root",
    width = 100,
    height = 100,
    align = "center",
    id = ++draggableIds,
    type
  }) {
    this.pos = { "x":0, "y":0 };
    this.d_pos = { "x":0, "y":0 };

    this.el = document.createElement("div");
    this.el.classList.add("draggables");
    
    this.el.style.width = `${width}px`;
    this.el.style.height = `${height + 20}px`;
    this.el.style.zIndex = topZ++;

    this.isMinimized = false;

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
      if (i == min || getTextWidth(title, "Roboto Slab", i) <= width-1) {
        titleEl.style.fontSize = `${i}px`;
        titleEl.style.paddingTop = `${(max-i)/2}px`; // center vertically

        break;
      }
    }

    const deleteEl = document.createElement("div");
    deleteEl.classList.add("draggable-deletes");
    deleteEl.setAttribute("title", "Close");

    this.minimizeEl = document.createElement("div");
    this.minimizeEl.classList.add("draggable-minimizes");
    this.minimizeEl.setAttribute("title", "Minimize");

    this.content = document.createElement("div");
    this.content.classList.add("draggable-contents");

    header.append(titleEl);
    header.append(this.minimizeEl);
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
    this.minimizeEl.addEventListener("mousedown", (e) => { e.stopPropagation(); });
    deleteEl.addEventListener("mousedown", (e) => { e.stopPropagation(); });
    
    deleteEl.addEventListener("click", this.remove.bind(this));
    this.minimizeEl.addEventListener("click", this.toggleMinimize.bind(this));
    
    this.id = Draggable.getIdentifier(id, type); 
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
  toggleMinimize() {
    if (this.isMinimized) { // do maximize
      this.el.classList.remove("minimized");
      this.isMinimized = false;
      this.minimizeEl.setAttribute("title", "Minimize");
    }
    else { // do minimize
      this.el.classList.add("minimized");
      this.isMinimized = true;
      this.minimizeEl.setAttribute("title", "Maximize");
    }
  }

  identify() {
    this.el.classList.add("brights");
    this.el.offsetHeight; // CSS reflow
    this.el.classList.remove("brights");
    this.el.classList.add("unbrights");

    setTimeout(() => {
      this.el.classList.remove("unbrights");
    }, 100);
    this.bringToTop();
    if (this.isMinimized) { this.toggleMinimize(); }
  }

  static getIdentifier(id, type) {
    return `<${type}>${id}`;
  }
}

class LargeElement extends Draggable {
  constructor({
    symbol,
    color,
    type = "LargeElement"
  }) {
    super({
      allDrag: false,
      title: elInfo.getName(symbol),
      width: 100,
      height: 100,
      id: symbol,
      type: type
    });

    const symbolWidth = Math.max(30, getTextWidth(symbol, "Roboto Slab", 40)); // symbol will be treated as having at lesat 30px of width

    const symbolEl = document.createElement("div");
    symbolEl.classList.add("large-element-symbols");
    symbolEl.classList.add("large-element-children");
    // symbolEl.classList.add("clickables");
    symbolEl.style.width = `${symbolWidth}px`;
    symbolEl.innerText = symbol;

    const number = elInfo.getNumber(symbol);
    const numberEl = document.createElement("div");
    numberEl.classList.add("large-element-numbers");
    numberEl.classList.add("large-element-children");
    numberEl.classList.add("clickables");
    numberEl.setAttribute("title", `${number} protons`);
    numberEl.innerText = number;

    numberEl.addEventListener("click", () => {
      const el = buildBigNumber({
        spawn: this.id,
        number: number,
        type: `${symbol} Number`
      });

      if (el.isNew) {
        this.el.parentElement.append(el.el);
        const bounds = this.el.getBoundingClientRect();
        el.setPos(
          bounds.left + bounds.width + 5,
          bounds.top
        );
      }
    })

    
    const mass = elInfo.getMass(symbol);
    const massEl = document.createElement("div");
    massEl.classList.add("large-element-masses");
    massEl.classList.add("large-element-children");
    massEl.classList.add("clickables");
    massEl.innerText = formatFloat(mass, 4);
    massEl.setAttribute("title", `~${formatFloat(mass, 5)} au, on average`);

    massEl.addEventListener("click", () => {
      const el = buildIsotopeDisplay({
        spawn: this.id,
        symbol: symbol
      });
      if (el.isNew) {
        this.el.parentElement.append(el.el);
        const bounds = this.el.getBoundingClientRect();
        el.setPos(
          bounds.left + bounds.width + 5,
          bounds.top
        );
      }
    });

    const valence = elInfo.getValence(symbol);
    const valenceEls = [];
    const posXConvert = [ -0.6, -0.2, 0, 0.2, 0.6 ];
    const posYConvert = [ -23, -8, 0, 8, 23 ];
    const xScale = symbolWidth;
    for (let pos of lewisStructurePos[valence-1]) {
      const valenceEl = document.createElement("div");
      valenceEl.classList.add("large-element-lewis-dots");
      valenceEl.classList.add("large-element-children");
      valenceEl.style.left = `calc(50% + ${posXConvert[pos.x]*xScale}px)`;
      valenceEl.style.top = `calc(50% + ${posYConvert[pos.y]}px)`;
      valenceEls.push(valenceEl);
    }

    const config = elInfo.getConfig(symbol);
    const configEl = document.createElement("div");
    configEl.classList.add("large-element-configurations");
    configEl.classList.add("large-element-children");
    // configEl.classList.add("clickables");
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
        // const shell = document.createElement("div");
        // shell.classList.add("large-element-configuration-shells");
        // shell.innerText = match[3];

        const subshell = document.createElement("div");
        subshell.classList.add("large-element-configuration-subshells");
        subshell.innerText = match[3] + match[4]; // same font, so these can be combined

        const index = document.createElement("div");
        index.classList.add("large-element-configuration-indicies");
        index.innerText = match[5];

        // termEl.append(shell);
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

export function buildLargeElement({
  symbol,
  color,
  type = "LargeElement"
}) {
  let el = getDraggable("LargeElement", symbol);
  if (el) {
    el.isNew = false;
    el.identify();
  }
  else {
    el = new LargeElement({
      symbol,
      color,
      type
    });
    el.isNew = true;
  }
  return el;
}

class IsotopeDisplay extends Draggable {
  constructor({
    symbol,
    spawn
  }) {
    super({
      title: `${symbol} Isotopes`,
      allDrag: false,
      id: symbol,
      spawn: spawn,
      height: 100,
      width: 200,
      type: "IsotopeDisplay"
    });
  }
}

export function buildIsotopeDisplay({
  symbol,
  spawn
}) {
  let el = getDraggable("IsotopeDisplay", symbol);
  if (el) {
    el.isNew = false;
    el.identify();
  }
  else {
    el = new IsotopeDisplay({
      symbol,
      spawn
    });
    el.isNew = true;
  }
  return el;
}

class BigNumber extends Draggable {
  constructor({
    type,
    number,
    spawn
  }) {
    super({
      title: type,
      type: "BigNumber",
      allDrag: false,
      height: 30,
      width: 100,
      id: type + ":" + number,
      spawn
    });

    this.number = number;

    const backgroundEl = document.createElement("div");
    backgroundEl.classList.add("big-number-children");
    backgroundEl.classList.add("big-number-backgrounds");

    const numberEl = document.createElement("div");
    numberEl.classList.add("big-number-children");
    numberEl.classList.add("big-number-values");
    numberEl.innerText = number;

    const maxSize = 20;
    const minSize = 10;
    for (let i = maxSize; i >= minSize; i--) {
      if (getTextWidth(number, "Roboto Slab", i) <= 93 || i == minSize) {
        numberEl.style.fontSize = `${i}px`;
        break;
      }
    }

    const copiedIndicatorEl = document.createElement("div");
    copiedIndicatorEl.classList.add("big-number-children");
    copiedIndicatorEl.classList.add("big-number-copieds");
    copiedIndicatorEl.innerText = "Copied!";

    backgroundEl.addEventListener("click", () => {
      navigator.clipboard.writeText(this.number.toString());
      copiedIndicatorEl.classList.add("actives");
      setTimeout(() => {
        copiedIndicatorEl.classList.remove("actives");
      }, 500);
    });


    backgroundEl.append(numberEl);
    backgroundEl.append(copiedIndicatorEl);
    this.content.append(backgroundEl);
  }
}

export function buildBigNumber({
  type,
  number,
  spawn
}) {
  let el = getDraggable("BigNumber", type + ":" + number);
  if (el) {
    el.isNew = false;
    el.identify();
  }
  else {
    el = new BigNumber({
      type,
      number,
      spawn
    });
    el.isNew = true;
  }
  return el;
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