/**
 * box.js - box element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */
import Element from './index';

class Box extends Element {
  type = 'box';
  constructor(options = {}) {
    // if (!(this instanceof Node)) return new Box(options);

    super(options);
  }
}

export default Box;
