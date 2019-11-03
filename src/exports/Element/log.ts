/**
 * log.js - log element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */
import util from 'util';

import ScrollableText from './scrollabletext';
const nextTick = global.setImmediate || process.nextTick.bind(process);

class Log extends ScrollableText {
  type = 'log';
  _clines: any;
  scrollback: number;
  scrollOnInput: boolean;
  _userScrolled: boolean = false;

  constructor(options: { [key: string]: any } = {}) {
    super(options);

    this.scrollback =
      options.scrollback != null ? options.scrollback : Infinity;

    this.scrollOnInput = options.scrollOnInput;

    this.on('set content', () => {
      if (!this._userScrolled || this.scrollOnInput) {
        nextTick(() => {
          this.setScrollPerc(100);
          this._userScrolled = false;
          if (this.screen) this.screen.render();
        });
      }
    });
  }

  // @ts-ignore
  scroll(offset: number, always: boolean = false) {
    if (offset === 0) return this._scroll(offset, always);
    this._userScrolled = true;
    const ret = this._scroll(offset, always);
    if (this.getScrollPerc() === 100) {
      this._userScrolled = false;
    }
    return ret;
  }

  _scroll(offset: number, always?: boolean) {
    // return this.scroll(offset, always);
  }

  add(..._args: any[]) {
    const args = [..._args];
    if (typeof args[0] === 'object') {
      args[0] = util.inspect(args[0], true, 20, true);
    }
    // @ts-ignore
    const text = util.format.apply(util, args);
    this.emit('log', text);
    const ret = this.pushLine(text);
    if (this._clines.fake.length > this.scrollback) {
      // @ts-ignore
      this.shiftLine(0, (this.scrollback / 3) | 0);
    }
    return ret;
  }

  log(...args: any[]) {
    return this.add(...args);
  }
}

export default Log;
