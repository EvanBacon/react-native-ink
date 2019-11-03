/**
 * helpers.js - helpers for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import fs from 'fs';

import * as unicode from './unicode';
import Screen from './screen';

/**
 * Helpers
 */

const helpers = exports;

// @ts-ignore
helpers.merge = (a, b) => {
  Object.keys(b).forEach(key => {
    a[key] = b[key];
  });
  return a;
};

helpers.asort = (obj: any): any =>
  obj.sort((a: any, b: any): number => {
    a = a.name.toLowerCase();
    b = b.name.toLowerCase();

    if (a[0] === '.' && b[0] === '.') {
      a = a[1];
      b = b[1];
    } else {
      a = a[0];
      b = b[0];
    }

    return a > b ? 1 : a < b ? -1 : 0;
  });

// @ts-ignore
helpers.hsort = (obj: any) => obj.sort(({ index }, { index }) => index - index);

helpers.findFile = (start: any, target: any): any =>
  (function read(dir) {
    let files: string[];
    let file;
    let stat;
    let out;

    if (dir === '/dev' || dir === '/sys' || dir === '/proc' || dir === '/net') {
      return null;
    }

    try {
      files = fs.readdirSync(dir);
    } catch (e) {
      files = [];
    }

    for (let i = 0; i < files.length; i++) {
      file = files[i];

      if (file === target) {
        return `${dir === '/' ? '' : dir}/${file}`;
      }

      try {
        stat = fs.lstatSync(`${dir === '/' ? '' : dir}/${file}`);
      } catch (e) {
        stat = null;
      }

      if (stat && stat.isDirectory() && !stat.isSymbolicLink()) {
        out = read(`${dir === '/' ? '' : dir}/${file}`);
        if (out) return out;
      }
    }

    return null;
  })(start);

// Escape text for tag-enabled elements.
helpers.escape = (text: string) =>
  text.replace(/[{}]/g, (ch: string) => (ch === '{' ? '{open}' : '{close}'));

helpers.parseTags = (text: string, screen: Screen) =>
  helpers.Element.prototype._parseTags.call(
    { parseTags: true, screen: screen || helpers.Screen.global },
    text,
  );

helpers.generateTags = (style: any, text: string) => {
  let open = '';
  let close = '';

  Object.keys(style || {}).forEach(key => {
    let val = style[key];
    if (typeof val === 'string') {
      val = val.replace(/^light(?!-)/, 'light-');
      val = val.replace(/^bright(?!-)/, 'bright-');
      open = `{${val}-${key}}${open}`;
      close += `{/${val}-${key}}`;
    } else {
      if (val === true) {
        open = `{${key}}${open}`;
        close += `{/${key}}`;
      }
    }
  });

  if (text != null) {
    return open + text + close;
  }

  return {
    open,
    close,
  };
};

helpers.attrToBinary = (style: any, element: any) =>
  helpers.Element.prototype.sattr.call(element || {}, style);

helpers.stripTags = (text: string) => {
  if (!text) return '';
  return text
    .replace(/{(\/?)([\w\-,;!#]*)}/g, '')
    .replace(/\x1b\[[\d;]*m/g, '');
};

helpers.cleanTags = (text: string) => helpers.stripTags(text).trim();

helpers.dropUnicode = (text: string) => {
  if (!text) return '';
  return text
    .replace(unicode.chars.all, '??')
    .replace(unicode.chars.combining, '')
    .replace(unicode.chars.surrogate, '?');
};

helpers.__defineGetter__('Screen', () => {
  if (!helpers._screen) {
    helpers._screen = require('./widgets/screen');
  }
  return helpers._screen;
});

helpers.__defineGetter__('Element', () => {
  if (!helpers._element) {
    helpers._element = require('./widgets/element');
  }
  return helpers._element;
});
