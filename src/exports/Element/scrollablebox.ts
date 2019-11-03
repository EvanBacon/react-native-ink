/**
 * scrollablebox.js - scrollable box element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */
import Box from './box';

export default class ScrollableBox extends Box {
  type = 'scrollable-box';
  shrink: any;
  scrollable: any;
  // XXX Potentially use this in place of scrollable checks elsewhere.
  get reallyScrollable() {
    if (this.shrink) {
      return this.scrollable;
    }
    return this.getScrollHeight() > this.height;
  }

  childOffset: any;
  childBase: any;
  baseLimit: any;
  alwaysScroll: any;
  scrollbar: any;
  track: any;
  _scrollingBar: any;
  _drag: any;

  constructor(options: any = {}) {
    // if (!(this instanceof Node)) {
    //   return new ScrollableBox(options);
    // }

    super(options);
    const self = this;

    if (options.scrollable === false) {
      return this;
    }

    this.scrollable = true;
    this.childOffset = 0;
    this.childBase = 0;
    this.baseLimit = options.baseLimit || Infinity;
    this.alwaysScroll = options.alwaysScroll;

    this.scrollbar = options.scrollbar;
    if (this.scrollbar) {
      this.scrollbar.ch = this.scrollbar.ch || ' ';
      this.style.scrollbar = this.style.scrollbar || this.scrollbar.style;
      if (!this.style.scrollbar) {
        this.style.scrollbar = {};
        this.style.scrollbar.fg = this.scrollbar.fg;
        this.style.scrollbar.bg = this.scrollbar.bg;
        this.style.scrollbar.bold = this.scrollbar.bold;
        this.style.scrollbar.underline = this.scrollbar.underline;
        this.style.scrollbar.inverse = this.scrollbar.inverse;
        this.style.scrollbar.invisible = this.scrollbar.invisible;
      }
      //this.scrollbar.style = this.style.scrollbar;
      if (this.track || this.scrollbar.track) {
        this.track = this.scrollbar.track || this.track;
        this.style.track = this.style.scrollbar.track || this.style.track;
        this.track.ch = this.track.ch || ' ';
        this.style.track = this.style.track || this.track.style;
        if (!this.style.track) {
          this.style.track = {};
          this.style.track.fg = this.track.fg;
          this.style.track.bg = this.track.bg;
          this.style.track.bold = this.track.bold;
          this.style.track.underline = this.track.underline;
          this.style.track.inverse = this.track.inverse;
          this.style.track.invisible = this.track.invisible;
        }
        this.track.style = this.style.track;
      }
      // Allow controlling of the scrollbar via the mouse:
      if (options.mouse) {
        this.on('mousedown', (data: any) => {
          if (self._scrollingBar) {
            // Do not allow dragging on the scrollbar:
            delete self.screen._dragging;
            delete self._drag;
            return;
          }
          const x = data.x - self.aleft;
          const y = data.y - self.atop;
          if (x === self.width - self.iright - 1) {
            // Do not allow dragging on the scrollbar:
            delete self.screen._dragging;
            delete self._drag;
            const perc = (y - self.itop) / (self.height - self.iheight);
            self.setScrollPerc((perc * 100) | 0);
            self.screen.render();
            let smd: any;
            let smu: any;
            self._scrollingBar = true;
            self.onScreenEvent(
              'mousedown',
              (smd = (data: any) => {
                const y = data.y - self.atop;
                const perc = y / self.height;
                self.setScrollPerc((perc * 100) | 0);
                self.screen.render();
              }),
            );
            // If mouseup occurs out of the window, no mouseup event fires, and
            // scrollbar will drag again on mousedown until another mouseup
            // occurs.
            self.onScreenEvent(
              'mouseup',
              (smu = () => {
                self._scrollingBar = false;
                self.removeScreenEvent('mousedown', smd);
                self.removeScreenEvent('mouseup', smu);
              }),
            );
          }
        });
      }
    }

    if (options.mouse) {
      this.on('wheeldown', () => {
        self.scroll((self.height / 2) | 0 || 1);
        self.screen.render();
      });
      this.on('wheelup', () => {
        self.scroll(-((self.height / 2) | 0) || -1);
        self.screen.render();
      });
    }

    if (options.keys && !options.ignoreKeys) {
      this.on('keypress', (ch: any, { name, ctrl, shift }: any) => {
        if (name === 'up' || (options.vi && name === 'k')) {
          self.scroll(-1);
          self.screen.render();
          return;
        }
        if (name === 'down' || (options.vi && name === 'j')) {
          self.scroll(1);
          self.screen.render();
          return;
        }
        if (options.vi && name === 'u' && ctrl) {
          self.scroll(-((self.height / 2) | 0) || -1);
          self.screen.render();
          return;
        }
        if (options.vi && name === 'd' && ctrl) {
          self.scroll((self.height / 2) | 0 || 1);
          self.screen.render();
          return;
        }
        if (options.vi && name === 'b' && ctrl) {
          self.scroll(-self.height || -1);
          self.screen.render();
          return;
        }
        if (options.vi && name === 'f' && ctrl) {
          self.scroll(self.height || 1);
          self.screen.render();
          return;
        }
        if (options.vi && name === 'g' && !shift) {
          self.scrollTo(0);
          self.screen.render();
          return;
        }
        if (options.vi && name === 'g' && shift) {
          self.scrollTo(self.getScrollHeight());
          self.screen.render();
          return;
        }
      });
    }

    this.on('parsed content', () => {
      self._recalculateIndex();
    });

    self._recalculateIndex();
  }

  _isList: any;
  items: any;

  _scrollBottom() {
    if (!this.scrollable) return 0;

    // We could just calculate the children, but we can
    // optimize for lists by just returning the items.length.
    if (this._isList) {
      return this.items ? this.items.length : 0;
    }

    if (this.lpos && this.lpos._scrollBottom) {
      return this.lpos._scrollBottom;
    }

    const bottom = this.children.reduce((current, el) => {
      // el.height alone does not calculate the shrunken height, we need to use
      // getCoords. A shrunken box inside a scrollable element will not grow any
      // larger than the scrollable element's context regardless of how much
      // content is in the shrunken box, unless we do this (call getCoords
      // without the scrollable calculation):
      // See: $ node test/widget-shrink-fail-2.js
      if (!el.detached) {
        const lpos = el._getCoords(false, true);
        if (lpos) {
          return Math.max(current, el.rtop + (lpos.yl - lpos.yi));
        }
      }
      return Math.max(current, el.rtop + el.height);
    }, 0);

    // XXX Use this? Makes .getScrollHeight() useless!
    // if (bottom < this._clines.length) bottom = this._clines.length;

    if (this.lpos) this.lpos._scrollBottom = bottom;

    return bottom;
  }

  getScroll() {
    return this.childBase + this.childOffset;
  }

  scroll(offset: number, always?: boolean) {
    if (!this.scrollable) return;

    if (this.detached) return;

    // Handle scrolling.
    const visible = this.height - this.iheight;

    const base = this.childBase;
    let d;
    let p;
    let t;
    let b;
    let max;
    let emax;

    if (this.alwaysScroll || always) {
      // Semi-workaround
      this.childOffset = offset > 0 ? visible - 1 + offset : offset;
    } else {
      this.childOffset += offset;
    }

    if (this.childOffset > visible - 1) {
      d = this.childOffset - (visible - 1);
      this.childOffset -= d;
      this.childBase += d;
    } else if (this.childOffset < 0) {
      d = this.childOffset;
      this.childOffset += -d;
      this.childBase += d;
    }

    if (this.childBase < 0) {
      this.childBase = 0;
    } else if (this.childBase > this.baseLimit) {
      this.childBase = this.baseLimit;
    }

    // Find max "bottom" value for
    // content and descendant elements.
    // Scroll the content if necessary.
    if (this.childBase === base) {
      return this.emit('scroll');
    }

    // When scrolling text, we want to be able to handle SGR codes as well as line
    // feeds. This allows us to take preformatted text output from other programs
    // and put it in a scrollable text box.
    this.parseContent();

    // XXX
    // max = this.getScrollHeight() - (this.height - this.iheight);

    max = this._clines.length - (this.height - this.iheight);
    if (max < 0) max = 0;
    emax = this._scrollBottom() - (this.height - this.iheight);
    if (emax < 0) emax = 0;

    this.childBase = Math.min(this.childBase, Math.max(emax, max));

    if (this.childBase < 0) {
      this.childBase = 0;
    } else if (this.childBase > this.baseLimit) {
      this.childBase = this.baseLimit;
    }

    // Optimize scrolling with CSR + IL/DL.
    p = this.lpos;
    // Only really need _getCoords() if we want
    // to allow nestable scrolling elements...
    // or if we **really** want shrinkable
    // scrolling elements.
    // p = this._getCoords();
    if (p && this.childBase !== base && this.screen.cleanSides(this)) {
      t = p.yi + this.itop;
      b = p.yl - this.ibottom - 1;
      d = this.childBase - base;

      if (d > 0 && d < visible) {
        // scrolled down
        this.screen.deleteLine(d, t, t, b);
      } else if (d < 0 && -d < visible) {
        // scrolled up
        d = -d;
        this.screen.insertLine(d, t, t, b);
      }
    }

    return this.emit('scroll');
  }

  _recalculateIndex() {
    let max;
    let emax;

    if (this.detached || !this.scrollable) {
      return 0;
    }

    // XXX
    // max = this.getScrollHeight() - (this.height - this.iheight);

    max = this._clines.length - (this.height - this.iheight);
    if (max < 0) max = 0;
    emax = this._scrollBottom() - (this.height - this.iheight);
    if (emax < 0) emax = 0;

    this.childBase = Math.min(this.childBase, Math.max(emax, max));

    if (this.childBase < 0) {
      this.childBase = 0;
    } else if (this.childBase > this.baseLimit) {
      this.childBase = this.baseLimit;
    }
  }

  resetScroll() {
    if (!this.scrollable) return;
    this.childOffset = 0;
    this.childBase = 0;
    return this.emit('scroll');
  }

  getScrollHeight() {
    return Math.max(this._clines.length, this._scrollBottom());
  }

  getScrollPerc(s?: boolean) {
    const pos = this.lpos || this._getCoords();
    if (!pos) return s ? -1 : 0;

    const height = pos.yl - pos.yi - this.iheight;
    const i = this.getScrollHeight();
    let p;

    if (height < i) {
      if (this.alwaysScroll) {
        p = this.childBase / (i - height);
      } else {
        p = (this.childBase + this.childOffset) / (i - 1);
      }
      return p * 100;
    }

    return s ? -1 : 0;
  }

  setScrollPerc(i: number) {
    // XXX
    // var m = this.getScrollHeight();
    const m = Math.max(this._clines.length, this._scrollBottom());
    return this.scrollTo(((i / 100) * m) | 0);
  }

  setScroll(offset: number, always?: boolean) {
    return this.scrollTo(offset, always);
  }

  scrollTo(offset: number, always?: boolean) {
    // XXX
    // At first, this appeared to account for the first new calculation of childBase:
    this.scroll(0);
    return this.scroll(offset - (this.childBase + this.childOffset), always);
  }
}
