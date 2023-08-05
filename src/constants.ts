const hl = 12; //                Hexagon-circumscribed circle diameter. "Long."
const hs = Math.sqrt(3) * hl / 2; // Hexagon-inscribed circle diameter. "Short."
const glyphScale = 3;
const glyphOffset = hl / 10;
const cy = hs * 211 / 208;

export default {hl, hs, glyphScale, glyphOffset, cy}
