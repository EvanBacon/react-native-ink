/**
 * colors.js - color-related functions for blessed.
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

export function match(r1: any, g1: any, b1: any): any {
  if (typeof r1 === 'string') {
    let hex = r1;
    if (hex[0] !== '#') {
      return -1;
    }
    hex = exports.hexToRGB(hex);
    (r1 = hex[0]), (g1 = hex[1]), (b1 = hex[2]);
  } else if (Array.isArray(r1)) {
    (b1 = r1[2]), (g1 = r1[1]), (r1 = r1[0]);
  }

  const hash = (r1 << 16) | (g1 << 8) | b1;

  if (exports._cache[hash] != null) {
    return exports._cache[hash];
  }

  let ldiff = Infinity;
  let li = -1;
  let i = 0;
  let c;
  let r2;
  let g2;
  let b2;
  let diff;

  for (; i < exports.vcolors.length; i++) {
    c = exports.vcolors[i];
    r2 = c[0];
    g2 = c[1];
    b2 = c[2];

    diff = colorDistance(r1, g1, b1, r2, g2, b2);

    if (diff === 0) {
      li = i;
      break;
    }

    if (diff < ldiff) {
      ldiff = diff;
      li = i;
    }
  }

  return (exports._cache[hash] = li);
}

export function RGBToHex(r: any, g: any, b: any): any {
  if (Array.isArray(r)) {
    (b = r[2]), (g = r[1]), (r = r[0]);
  }

  function hex(n: number): string {
    const nn = n.toString(16);
    return nn.length < 2 ? `0${nn}` : nn;
  }

  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export function hexToRGB(hex: any): number[] {
  if (hex.length === 4) {
    hex = hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  const col = parseInt(hex.substring(1), 16);
  const r = (col >> 16) & 0xff;
  const g = (col >> 8) & 0xff;
  const b = col & 0xff;

  return [r, g, b];
}

// As it happens, comparing how similar two colors are is really hard. Here is
// one of the simplest solutions, which doesn't require conversion to another
// color space, posted on stackoverflow[1]. Maybe someone better at math can
// propose a superior solution.
// [1] http://stackoverflow.com/questions/1633828

// @ts-ignore
function colorDistance(r1, g1, b1, r2, g2, b2) {
  return 30 * (r1 - r2) ** 2 + 59 * (g1 - g2) ** 2 + 11 * (b1 - b2) ** 2;
}

// This might work well enough for a terminal's colors: treat RGB as XYZ in a
// 3-dimensional space and go midway between the two points.
// @ts-ignore
export function mixColors(c1, c2, alpha) {
  // if (c1 === 0x1ff) return c1;
  // if (c2 === 0x1ff) return c1;
  if (c1 === 0x1ff) c1 = 0;
  if (c2 === 0x1ff) c2 = 0;
  if (alpha == null) alpha = 0.5;

  c1 = exports.vcolors[c1];
  let r1 = c1[0];
  let g1 = c1[1];
  let b1 = c1[2];

  c2 = exports.vcolors[c2];
  const r2 = c2[0];
  const g2 = c2[1];
  const b2 = c2[2];

  r1 += ((r2 - r1) * alpha) | 0;
  g1 += ((g2 - g1) * alpha) | 0;
  b1 += ((b2 - b1) * alpha) | 0;

  return exports.match([r1, g1, b1]);
}

export function blend(attr: any, attr2: any, alpha: any): any {
  let name;
  let i;
  let c;
  let nc;

  let bg = attr & 0x1ff;
  if (attr2 != null) {
    let bg2 = attr2 & 0x1ff;
    if (bg === 0x1ff) bg = 0;
    if (bg2 === 0x1ff) bg2 = 0;
    bg = exports.mixColors(bg, bg2, alpha);
  } else {
    // @ts-ignore
    if (blend._cache[bg] != null) {
      // @ts-ignore
      bg = blend._cache[bg];
      // } else if (bg < 8) {
      //   bg += 8;
    } else if (bg >= 8 && bg <= 15) {
      bg -= 8;
    } else {
      name = exports.ncolors[bg];
      if (name) {
        for (i = 0; i < exports.ncolors.length; i++) {
          if (name === exports.ncolors[i] && i !== bg) {
            c = exports.vcolors[bg];
            nc = exports.vcolors[i];
            if (nc[0] + nc[1] + nc[2] < c[0] + c[1] + c[2]) {
              // @ts-ignore
              blend._cache[bg] = i;
              bg = i;
              break;
            }
          }
        }
      }
    }
  }

  attr &= ~0x1ff;
  attr |= bg;

  let fg = (attr >> 9) & 0x1ff;
  if (attr2 != null) {
    let fg2 = (attr2 >> 9) & 0x1ff;
    // 0, 7, 188, 231, 251
    if (fg === 0x1ff) {
      // XXX workaround
      fg = 248;
    } else {
      if (fg === 0x1ff) fg = 7;
      if (fg2 === 0x1ff) fg2 = 7;
      fg = exports.mixColors(fg, fg2, alpha);
    }
  } else {
    // @ts-ignore
    if (blend._cache[fg] != null) {
      // @ts-ignore
      fg = blend._cache[fg];
      // } else if (fg < 8) {
      //   fg += 8;
    } else if (fg >= 8 && fg <= 15) {
      fg -= 8;
    } else {
      name = exports.ncolors[fg];
      if (name) {
        for (i = 0; i < exports.ncolors.length; i++) {
          if (name === exports.ncolors[i] && i !== fg) {
            c = exports.vcolors[fg];
            nc = exports.vcolors[i];
            if (nc[0] + nc[1] + nc[2] < c[0] + c[1] + c[2]) {
              // @ts-ignore
              blend._cache[fg] = i;
              fg = i;
              break;
            }
          }
        }
      }
    }
  }

  attr &= ~(0x1ff << 9);
  attr |= fg << 9;

  return attr;
}

// @ts-ignore
blend._cache = {};

export var _cache = {};

export function reduce(color: any, total: any): any {
  if (color >= 16 && total <= 16) {
    color = exports.ccolors[color];
  } else if (color >= 8 && total <= 8) {
    color -= 8;
  } else if (color >= 2 && total <= 2) {
    color %= 2;
  }
  return color;
}

// XTerm Colors
// These were actually tough to track down. The xterm source only uses color
// keywords. The X11 source needed to be examined to find the actual values.
// They then had to be mapped to rgb values and then converted to hex values.
export var xterm = [
  '#000000', // black
  '#cd0000', // red3
  '#00cd00', // green3
  '#cdcd00', // yellow3
  '#0000ee', // blue2
  '#cd00cd', // magenta3
  '#00cdcd', // cyan3
  '#e5e5e5', // gray90
  '#7f7f7f', // gray50
  '#ff0000', // red
  '#00ff00', // green
  '#ffff00', // yellow
  '#5c5cff', // rgb:5c/5c/ff
  '#ff00ff', // magenta
  '#00ffff', // cyan
  '#ffffff', // white
];

// Seed all 256 colors. Assume xterm defaults.
// Ported from the xterm color generation script.
export var colors = (() => {
  const cols = (exports.colors = []);
  const _cols = (exports.vcolors = []);
  let r;
  let g;
  let b;
  let i;
  let l;

  function hex(n: number): string {
    const nn = n.toString(16);
    if (nn.length > 1) return nn;
    return `0${nn}`;
  }

  // @ts-ignore
  function push(i, r, g, b) {
    // @ts-ignore
    cols[i] = `#${hex(r)}${hex(g)}${hex(b)}`;
    // @ts-ignore
    _cols[i] = [r, g, b];
  }

  // 0 - 15
  // @ts-ignore
  exports.xterm.forEach((c, i) => {
    c = parseInt(c.substring(1), 16);
    push(i, (c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff);
  });

  // 16 - 231
  for (r = 0; r < 6; r++) {
    for (g = 0; g < 6; g++) {
      for (b = 0; b < 6; b++) {
        i = 16 + r * 36 + g * 6 + b;
        push(i, r ? r * 40 + 55 : 0, g ? g * 40 + 55 : 0, b ? b * 40 + 55 : 0);
      }
    }
  }

  // 232 - 255 are grey.
  for (g = 0; g < 24; g++) {
    l = g * 10 + 8;
    i = 232 + g;
    push(i, l, l, l);
  }

  return cols;
})();

// Map higher colors to the first 8 colors.
// This allows translation of high colors to low colors on 8-color terminals.
// @ts-ignore
export var ccolors = (() => {
  const _cols = exports.vcolors.slice();
  const cols = exports.colors.slice();
  let out;

  exports.vcolors = exports.vcolors.slice(0, 8);
  exports.colors = exports.colors.slice(0, 8);

  out = cols.map(exports.match);

  exports.colors = cols;
  exports.vcolors = _cols;
  exports.ccolors = out;

  return out;
})();

const colorNames = (exports.colorNames = {
  // special
  default: -1,
  normal: -1,
  bg: -1,
  fg: -1,
  // normal
  black: 0,
  red: 1,
  green: 2,
  yellow: 3,
  blue: 4,
  magenta: 5,
  cyan: 6,
  white: 7,
  // light
  lightblack: 8,
  lightred: 9,
  lightgreen: 10,
  lightyellow: 11,
  lightblue: 12,
  lightmagenta: 13,
  lightcyan: 14,
  lightwhite: 15,
  // bright
  brightblack: 8,
  brightred: 9,
  brightgreen: 10,
  brightyellow: 11,
  brightblue: 12,
  brightmagenta: 13,
  brightcyan: 14,
  brightwhite: 15,
  // alternate spellings
  grey: 8,
  gray: 8,
  lightgrey: 7,
  lightgray: 7,
  brightgrey: 7,
  brightgray: 7,
});

// @ts-ignore
export function convert(color) {
  if (typeof color === 'number') {
  } else if (typeof color === 'string') {
    color = color.replace(/[\- ]/g, '');
    // @ts-ignore
    if (colorNames[color] != null) {
      // @ts-ignore
      color = colorNames[color];
    } else {
      color = exports.match(color);
    }
  } else if (Array.isArray(color)) {
    color = exports.match(color);
  } else {
    color = -1;
  }
  return color !== -1 ? color : 0x1ff;
}

// Map higher colors to the first 8 colors.
// This allows translation of high colors to low colors on 8-color terminals.
// Why the hell did I do this by hand?
// @ts-ignore
export var ccolors = {
  blue: [
    4,
    12,
    [17, 21],
    [24, 27],
    [31, 33],
    [38, 39],
    45,
    [54, 57],
    [60, 63],
    [67, 69],
    [74, 75],
    81,
    [91, 93],
    [97, 99],
    [103, 105],
    [110, 111],
    117,
    [128, 129],
    [134, 135],
    [140, 141],
    [146, 147],
    153,
    165,
    171,
    177,
    183,
    189,
  ],

  green: [
    2,
    10,
    22,
    [28, 29],
    [34, 36],
    [40, 43],
    [46, 50],
    [64, 65],
    [70, 72],
    [76, 79],
    [82, 86],
    [106, 108],
    [112, 115],
    [118, 122],
    [148, 151],
    [154, 158],
    [190, 194],
  ],

  cyan: [
    6,
    14,
    23,
    30,
    37,
    44,
    51,
    66,
    73,
    80,
    87,
    109,
    116,
    123,
    152,
    159,
    195,
  ],

  red: [
    1,
    9,
    52,
    [88, 89],
    [94, 95],
    [124, 126],
    [130, 132],
    [136, 138],
    [160, 163],
    [166, 169],
    [172, 175],
    [178, 181],
    [196, 200],
    [202, 206],
    [208, 212],
    [214, 218],
    [220, 224],
  ],

  magenta: [
    5,
    13,
    53,
    90,
    96,
    127,
    133,
    139,
    164,
    170,
    176,
    182,
    201,
    207,
    213,
    219,
    225,
  ],

  yellow: [3, 11, 58, [100, 101], [142, 144], [184, 187], [226, 230]],

  black: [0, 8, 16, 59, 102, [232, 243]],

  white: [7, 15, 145, 188, 231, [244, 255]],
};

export var ncolors = [];

Object.keys(exports.ccolors).forEach(name => {
  // @ts-ignore
  exports.ccolors[name].forEach(offset => {
    if (typeof offset === 'number') {
      exports.ncolors[offset] = name;
      exports.ccolors[offset] = exports.colorNames[name];
      return;
    }
    for (let i = offset[0], l = offset[1]; i <= l; i++) {
      exports.ncolors[i] = name;
      exports.ccolors[i] = exports.colorNames[name];
    }
  });
  delete exports.ccolors[name];
});
