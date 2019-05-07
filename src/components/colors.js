import chroma from "chroma-js";

const COLOR_POINTS = ["#003f5c", "#58508d", "#bc5090", "#ff6361", "#ffa600"];

export const getPalette = numColors =>
  chroma
    .bezier(COLOR_POINTS)
    .scale()
    .correctLightness()
    .colors(numColors);
