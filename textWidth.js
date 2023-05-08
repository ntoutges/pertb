const c = document.getElementById("text-width-getter");
const ctx = c.getContext("2d");

export function getTextWidth(text, font, fontSize) {
  ctx.font = `${fontSize}px ${font}`;
  return ctx.measureText(text).width;
}