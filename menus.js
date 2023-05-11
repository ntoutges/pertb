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
    this.hasMoved = false;
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
    
    deleteEl.addEventListener("mousedown", (e) => {
      if (e.button == 0) this.remove(); // left click
    });
    deleteEl.addEventListener("contextmenu", (e) => { // right click
      e.preventDefault();
      this.removeChildren();
    })

    this.minimizeEl.addEventListener("click", this.toggleMinimize.bind(this));
    
    this.id = Draggable.getIdentifier(id, type); 
    draggables[this.id] = this;
    if (!(spawn in draggableHeritage)) draggableHeritage[spawn] = [];
    draggableHeritage[spawn].push(this.id);
    
    this.spawn = spawn;
  }

  startDrag(e) {
    if (e.button == 1) {
      this.remove(); // middle click removes window
      return;
    }
    this.d_pos.x = e.pageX - this.pos.x;
    this.d_pos.y = e.pageY - this.pos.y;
    dragging = this;
    this.hasMoved = true;
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
    this.hasMoved = true;
  }

  remove() {
    this.el.remove();
    delete draggables[this.id];
    const index = draggableHeritage[this.spawn].indexOf(this.id);
    if (index != -1) draggableHeritage[this.spawn].splice(index, 1);
    if (draggableHeritage[this.spawn].length == 0) delete draggableHeritage[this.spawn]; // no children, therefore no need to store
    this.removeChildren();
  }
  removeChildren() {
    if (this.id in draggableHeritage) {
      const toRemove = [];
      for (const id of draggableHeritage[this.id]) {
        toRemove.push(draggables[id]);
      }
      for (const el of toRemove) {
        el.remove();
      }
    }
    this.hasMoved = true; // flag to indicate if elements that produce children in consecutive locations should reset their counters
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
    symbolEl.classList.add("clickables");
    symbolEl.style.width = `${symbolWidth}px`;
    symbolEl.innerText = symbol;

    symbolEl.addEventListener("click", () => {
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
          bounds.left - bounds.width - 5,
          bounds.top
        );
      }
    });

    
    const mass = elInfo.getMass(symbol);
    const massEl = document.createElement("div");
    massEl.classList.add("large-element-masses");
    massEl.classList.add("large-element-children");
    massEl.classList.add("clickables");
    massEl.innerText = formatFloat(mass, 5);
    massEl.setAttribute("title", `~${formatFloat(mass, 5)} au, on average`);

    massEl.addEventListener("click", () => {
      const el = buildBigNumber({
        spawn: this.id,
        number: mass,
        type: `${mass} Mass`
      });

      if (el.isNew) {
        this.el.parentElement.append(el.el);
        const bounds = this.el.getBoundingClientRect();
        el.setPos(
          bounds.left - bounds.width - 5,
          bounds.top + 55
        );
      }
    });

    // don't even try to draw lewis structure for transition metals (they just don't behave)
    if (elInfo.getGroup(symbol) != "Transition Metal") {
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

      valenceEls.forEach(valenceEl => { this.content.append(valenceEl); });
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

      termEl.addEventListener("click", () => {
        const el = buildElectronConfig({
          spawn: this.id,
          terms: config,
          symbol: symbol
        });
        if (el.isNew) {
          this.el.parentElement.append(el.el);
          const bounds = this.el.getBoundingClientRect();
          el.setPos(
            bounds.left,
            bounds.top - 55
          );
        }
      });

      configEl.append(termEl);
    }

    const moreInfoEl = document.createElement("div");
    moreInfoEl.classList.add("large-element-children");
    moreInfoEl.classList.add("large-element-more-infos");
    moreInfoEl.setAttribute("title", "raw data");

    moreInfoEl.addEventListener("click", () => {
      const el = buildRawData({
        spawn: this.id,
        symbol: symbol
      });
      if (el.isNew) {
        this.el.parentElement.append(el.el);
        const bounds = this.el.getBoundingClientRect();
        el.setPos(
          bounds.left,
          bounds.top + bounds.height + 5
        );
      }
    });

    this.content.style.backgroundColor = color;

    this.content.append(symbolEl);
    this.content.append(numberEl);
    this.content.append(massEl);
    this.content.append(configEl);
    this.content.append(moreInfoEl);
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

    const isotopes = elInfo.getIsotopes(symbol);
    let maxFrequency = 0.001; // small, non-zero to prevent divide-by-zero error
    const isotopeNumPattern = /.+-(\d+)/;

    for (let i in isotopes) {
      maxFrequency = Math.max(maxFrequency, isotopes[i].frequency);
      // const isotopeNum = i.match(isotopeNumPattern)[1];
    }
    
    this.currentIsotope = null;
    this.isotopePos = {};
    this.graphChangeEnabled = true;

    const graphEl = document.createElement("div");
    graphEl.classList.add("isotope-display-children");
    graphEl.classList.add("isotope-display-graphs");

    graphEl.addEventListener("mouseleave", () => { this.graphChangeEnabled = true; })

    const abundance = document.createElement("div");
    abundance.classList.add("isotope-display-children");
    abundance.classList.add("isotope-display-headers");
    abundance.innerText = "Abundance";
    const abundanceVal = document.createElement("div");
    abundanceVal.classList.add("isotope-display-children");
    abundanceVal.classList.add("isotope-display-values");
    abundanceVal.style.top = "14px";
    abundanceVal.innerText = "---";

    abundanceVal.addEventListener("click", this.buildAbundance.bind(this, isotopes));

    const mass = document.createElement("div");
    mass.classList.add("isotope-display-children");
    mass.classList.add("isotope-display-headers");
    mass.classList.add("isotope-display-mass-headers");
    mass.style.top = "32px";
    mass.innerText = "Mass";
    const massVal = document.createElement("div");
    massVal.classList.add("isotope-display-children");
    massVal.classList.add("isotope-display-values");
    massVal.classList.add("isotope-display-mass-values");
    massVal.style.top = "46px";
    massVal.innerText = "---";

    massVal.addEventListener("click", this.buildMass.bind(this, isotopes));

    const neutrons = document.createElement("div");
    neutrons.classList.add("isotope-display-children");
    neutrons.classList.add("isotope-display-headers");
    neutrons.style.top = "64px";
    neutrons.innerText = "Neutrons";
    const neutronsVal = document.createElement("div");
    neutronsVal.classList.add("isotope-display-children");
    neutronsVal.classList.add("isotope-display-values");
    neutronsVal.style.top = "78px";
    neutronsVal.innerText = "---";

    neutronsVal.addEventListener("click", this.buildNeutrons.bind(this, isotopeNumPattern, symbol));

    let oldHighlight = null;

    const thisOne = this;
    // NOTE: need a way to add nearly-imperceptible elements
    // and autoscale on x-axis
    for (let i in isotopes) {
      const isotope = isotopes[i];
      let height = 80 * isotope.frequency / maxFrequency; // normalize to a specific height
      
      const isotopeNumber = i.match(isotopeNumPattern)[1];
      const barContainer = document.createElement("div");
      barContainer.classList.add("isotope-display-graph-bars");
      barContainer.setAttribute("data-isotope", i);
      barContainer.setAttribute("title", `${i}; right-click for more info`)

      const bar = document.createElement("div");
      bar.classList.add("isotope-display-graph-bar-graphics");
      if (isotope.frequency == 0) {
        height = 80;
        bar.classList.add("unavailables");
      }
      bar.style.height = `${height}px`;
      bar.style.top = `${80-height}px`;

      const divider = document.createElement("div");
      divider.classList.add("isotope-display-graph-bar-dividers");
      divider.style.top = `${80-height}px`;

      const isotopeNumContainer = document.createElement("div");
      isotopeNumContainer.classList.add("isotope-display-graph-bar-numbers")
      isotopeNumContainer.style.top = `${80-height}px`;

      const isotopeNum = document.createElement("div");
      isotopeNum.classList.add("isotope-display-graph-bar-numbers-value");
      isotopeNum.innerText = isotopeNumber

      isotopeNumContainer.append(isotopeNum);

      barContainer.append(bar);
      barContainer.append(divider);
      barContainer.append(isotopeNumContainer);
      graphEl.append(barContainer);

      barContainer.addEventListener("mouseenter", () => {
        if (!this.graphChangeEnabled) return;
        doSelect();
      });
      barContainer.addEventListener("click", () => {
        this.graphChangeEnabled = false;
        doSelect();
      });
      barContainer.addEventListener("contextmenu", (e) => { // also allow right click to select
        this.graphChangeEnabled = false;
        doSelect();
      });

      function doSelect() {
        barContainer.classList.add("actives");
        thisOne.currentIsotope = i;
        if (height < 5) {
          bar.style.height = "2px";
          bar.style.top = "78px";
          divider.style.top = "78px"
          isotopeNum.style.top = "78px";
        }

        abundanceVal.innerText = (isotope.frequency != 0) ? formatFloat(isotope.frequency * 100, 10) + "%" : "Negligible";
        massVal.innerText = formatFloat(isotope.mass, 10);
        neutronsVal.innerText = Math.max(parseInt(+isotopeNumber - elInfo.getNumber(symbol)), 0); // prevent from going negative due to Muonium

        if (oldHighlight != null && oldHighlight != barContainer) {
          let oldHeight = 80 * isotopes[oldHighlight.getAttribute("data-isotope")].frequency / maxFrequency;
          if (oldHeight == 0) { oldHeight = 80; }
          oldHighlight.classList.remove("actives");
          oldHighlight.querySelector(".isotope-display-graph-bar-graphics").style.height = `${oldHeight}px`;
          oldHighlight.querySelector(".isotope-display-graph-bar-graphics").style.top = `${80-oldHeight}px`;
          oldHighlight.querySelector(".isotope-display-graph-bar-dividers").style.top = `${80-oldHeight}px`;
          oldHighlight.querySelector(".isotope-display-graph-bar-numbers-value").style.top = `${80-oldHeight}px`;
        }
        oldHighlight = barContainer;
      }
      // barContainer.addEventListener("mouseleave", () => {
      //   barContainer.classList.remove("actives");
      //   bar.style.height = `${height}px`;
      //   bar.style.top = `${80-height}px`;
      //   divider.style.top = `${80-height}px`;
      //   isotopeNum.style.top = `${80-height}px`;
      // });

      barContainer.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        this.buildAbundance(isotopes);
        this.buildMass(isotopes);
        this.buildNeutrons(isotopeNumPattern, symbol);
        this.buildName(isotope);
      });
    }

    this.content.append(abundance);
    this.content.append(abundanceVal);
    this.content.append(mass);
    this.content.append(massVal);
    this.content.append(neutrons);
    this.content.append(neutronsVal);

    this.content.append(graphEl);
    
    // this.content.style.overflowY = "auto";
  }

  buildAbundance(isotopes) {
    if (this.currentIsotope == null) return;
    const el = buildBigNumber({
      spawn: this.id,
      number: isotopes[this.currentIsotope].frequency,
      type: this.currentIsotope + " abundance"
    });
    if (el.isNew) {
      this.el.parentElement.append(el.el);
      const bounds = this.el.getBoundingClientRect();
      
      if (this.hasMoved) this.isotopePos = {};
      this.hasMoved = false;
      if (!(this.currentIsotope in this.isotopePos)) this.isotopePos[this.currentIsotope] = 0;
      el.setPos(
        bounds.left + bounds.width + 5 + 105*this.isotopePos[this.currentIsotope],
        bounds.top + (Object.keys(this.isotopePos).length-1) * 55
      );
      this.isotopePos[this.currentIsotope]++;
    }
  }
  buildMass(isotopes) {
    if (this.currentIsotope == null) return;
    const el = buildBigNumber({
      spawn: this.id,
      number: isotopes[this.currentIsotope].mass,
      type: this.currentIsotope + " mass"
    });
    if (el.isNew) {
      this.el.parentElement.append(el.el);
      const bounds = this.el.getBoundingClientRect();
      
      if (this.hasMoved) this.isotopePos = {};
      this.hasMoved = false;
      if (!(this.currentIsotope in this.isotopePos)) this.isotopePos[this.currentIsotope] = 0;
      el.setPos(
        bounds.left + bounds.width + 5 + 105*this.isotopePos[this.currentIsotope],
        bounds.top + (Object.keys(this.isotopePos).length-1) * 55
      );
      this.isotopePos[this.currentIsotope]++;
    }
  }
  buildNeutrons(isotopeNumPattern, symbol) {
    if (this.currentIsotope == null) return;
    const neutronCount = Math.max(+this.currentIsotope.match(isotopeNumPattern)[1] - elInfo.getNumber(symbol), 0); // prevent from going negative, due to Muonium
    const el = buildBigNumber({
      spawn: this.id,
      number: neutronCount,
      type: this.currentIsotope + " neutrons"
    });
    if (el.isNew) {
      this.el.parentElement.append(el.el);
      const bounds = this.el.getBoundingClientRect();
      
      if (this.hasMoved) this.isotopePos = {};
      this.hasMoved = false;
      if (!(this.currentIsotope in this.isotopePos)) this.isotopePos[this.currentIsotope] = 0;
      el.setPos(
        bounds.left + bounds.width + 5 + 105*this.isotopePos[this.currentIsotope],
        bounds.top + (Object.keys(this.isotopePos).length-1) * 55
      );
      this.isotopePos[this.currentIsotope]++;
    }
  }
  buildName(isotope) {
    if (this.currentIsotope == null) return;
    if (!("name" in isotope)) return;
    const el = buildBigNumber({
      spawn: this.id,
      number: isotope.name,
      type: this.currentIsotope + " name"
    });
    if (el.isNew) {
      this.el.parentElement.append(el.el);
      const bounds = this.el.getBoundingClientRect();
      
      if (this.hasMoved) this.isotopePos = {};
      this.hasMoved = false;
      if (!(this.currentIsotope in this.isotopePos)) this.isotopePos[this.currentIsotope] = 0;
      el.setPos(
        bounds.left + bounds.width + 5 + 105*this.isotopePos[this.currentIsotope],
        bounds.top + (Object.keys(this.isotopePos).length-1) * 55
      );
      this.isotopePos[this.currentIsotope]++;
    }
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
      allDrag: true,
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

class ElectronConfig extends Draggable {
  constructor({
    spawn,
    terms,
    symbol
  }) {
    let workingConfig = terms.split(" ");
    for (let i = 0; i < workingConfig.length; i++) {
      let term = workingConfig[i];
      if (term[0] == "[") { // noble gas -- need to expand
        const el = term.substring(1,term.length-1); // get noble gas symbol
        let toAdd = elInfo.getConfig(el).split(" ");

        // combine arrays, replacing noble gas with expansion
        workingConfig = toAdd.concat(workingConfig.slice(1));
        i--; // continue working at old location
      }
    }

    let config = workingConfig.join(" ");
    const largeText = (config + " ").replace(/\d+ /g, "");
    let smallText = (" " + config).replace(/ \d+[^\d ]+/g, "");

    let totalWidth = Math.max(getTextWidth(largeText, "Roboto Slab", 15) + getTextWidth(smallText, "Roboto Slab", 10) + workingConfig.length * 4, 50);

    super({
      allDrag: true,
      title: symbol + " Config",
      type: "ElectronConfig",
      id: terms,
      spawn,
      height: 30,
      width: totalWidth
    });

    const termContainer = document.createElement("div");
    termContainer.classList.add("electron-configuration-term-holders");

    const configPattern = /(\d+)(\D)(\d+)$/;
    for (const term of config.split(" ")) {
      const match = term.match(configPattern);

      const termEl = document.createElement("div");
      termEl.classList.add("electron-configuration-terms");

      // const shell = document.createElement("div");
      // shell.classList.add("large-element-configuration-shells");
      // shell.innerText = match[3];

      const subshell = document.createElement("div");
      subshell.classList.add("electron-configuration-subshells");
      subshell.innerText = match[1] + match[2]; // same font, so these can be combined

      const index = document.createElement("div");
      index.classList.add("electron-configuration-indicies");
      index.innerText = match[3];

      // termEl.append(shell);
      termEl.append(subshell);
      termEl.append(index);

      termContainer.append(termEl);
    }
    this.content.append(termContainer);
  }
}

export function buildElectronConfig({
  spawn,
  terms,
  symbol
}) {
  let el = getDraggable("ElectronConfig", terms);
  if (el) {
    el.isNew = false;
    el.identify();
  }
  else {
    el = new ElectronConfig({
      spawn,
      terms,
      symbol
    });
    el.isNew = true;
  }
  return el;
}

class RawData extends Draggable {
  constructor({
    symbol,
    spawn
  }) {
    super({
      spawn,
      width: 250,
      height: 200,
      type: "RawData",
      id: symbol,
      align: "left",
      allDrag: false,
      title: symbol + " Raw Data"
    });

    const dataEl = document.createElement("div");
    dataEl.classList.add("raw-data-children");
    dataEl.classList.add("raw-data-data");

    dataEl.innerText = formatJSON(elInfo.getRaw(symbol));

    this.content.append(dataEl);
  }
}

export function buildRawData({
  symbol,
  spawn
}) {
  let el = getDraggable("RawData", symbol);
  if (el) {
    el.isNew = false;
    el.identify();
  }
  else {
    el = new RawData({
      spawn,
      symbol
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

function formatJSON(obj, layers=1) {
  if (obj == null) return "null";
  const isArr = Array.isArray(obj);
  let dataStr = "";

  let spaces = "";
  let spaces1 = "";
  for (let i = 0; i < layers; i++) {
    spaces += "  ";
    if (i != 0) spaces1 += "  ";
  }
  
  for (let key in obj) {
    dataStr += spaces;
    if (!isArr) dataStr += key + ": ";
    
    const type = typeof obj[key]
    if (type == "object") { dataStr += formatJSON(obj[key], layers+1); }
    else if (type == "string") { dataStr += `\"${obj[key]}\"` }
    else dataStr += obj[key].toString();

    dataStr += ",\n";
  }

  if (dataStr.length != 0) {
    dataStr = dataStr.substring(0, dataStr.length-2); // remove trailing ",\n"
  }

  if (isArr) {
    return (obj.length == 0) ? "[]" : "[\n" + dataStr + "\n" + spaces1 + "]";
  }
  return (Object.keys(obj).length == 0) ? "{}" : "{\n" + dataStr + "\n" + spaces1 + "}";
}