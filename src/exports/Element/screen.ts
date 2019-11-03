/**
 * screen.js - screen node for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */
import cp from 'child_process';
import fs from 'fs';
import path from 'path';

import Element from '.';
import Box from './box';
import * as colors from './colors';
import Log from './log';
import Node from './node';
import Program from './program';
import * as unicode from './unicode';

const helpers = require('./helpers');

const nextTick = global.setImmediate || process.nextTick.bind(process);

class Screen extends Node {
  static global = null;

  static total = 0;

  static instances: any[] = [];

  type = 'screen';

  cursor: any;
  program: any;
  _cursorBlink: any;

  static _bound: boolean = false;
  static _exceptionHandler = (error: Error) => {};

  static bind = (screen: any) => {
    if (!Screen.global) {
      Screen.global = screen;
    }

    if (!~Screen.instances.indexOf(screen)) {
      Screen.instances.push(screen);
      screen.index = Screen.total;
      Screen.total++;
    }

    if (Screen._bound) return;
    Screen._bound = true;

    process.on(
      'uncaughtException',
      (Screen._exceptionHandler = err => {
        if (process.listeners('uncaughtException').length > 1) {
          return;
        }
        Screen.instances.slice().forEach(screen => {
          screen.destroy();
        });
        err = err || new Error('Uncaught Exception.');
        console.error(err.stack ? `${err.stack}` : `${err}`);
        nextTick(() => {
          process.exit(1);
        });
      }),
    );

    (['SIGTERM', 'SIGINT', 'SIGQUIT'] as any[]).forEach(signal => {
      const name = `_${signal.toLowerCase()}Handler`;
      process.on(
        signal,
        // @ts-ignore
        (Screen[name] = () => {
          if (process.listeners(signal).length > 1) {
            return;
          }
          nextTick(() => {
            process.exit(0);
          });
        }),
      );
    });

    process.on(
      'exit',
      // @ts-ignore
      (Screen._exitHandler = () => {
        Screen.instances.slice().forEach(screen => {
          screen.destroy();
        });
      }),
    );
  };

  _destroy(): any {
    return this.destroy();
  }

  focusPrev() {
    return this.focusPrevious();
  }

  focusPrevious() {
    return this.focusOffset(-1);
  }

  unkey(...args: any[]): any {
    return this.removeKey(...args);
  }

  removeKey(...args: any[]): any {
    return this.program.unkey.apply(this, args);
  }

  cursorReset() {
    return this.resetCursor();
  }

  resetCursor() {
    this.cursor.shape = 'block';
    this.cursor.blink = false;
    this.cursor.color = null;
    this.cursor._set = false;

    if (this.cursor.artificial) {
      this.cursor.artificial = false;
      if (this.program.hideCursor_old) {
        this.program.hideCursor = this.program.hideCursor_old;
        delete this.program.hideCursor_old;
      }
      if (this.program.showCursor_old) {
        this.program.showCursor = this.program.showCursor_old;
        delete this.program.showCursor_old;
      }
      if (this._cursorBlink) {
        clearInterval(this._cursorBlink);
        delete this._cursorBlink;
      }
      return true;
    }

    return this.program.cursorReset();
  }

  get cols() {
    return this.program.cols;
  }

  get title() {
    return this.program.title;
  }

  set title(title: string) {
    this.program.title = title;
  }

  get terminal() {
    return this.program.terminal;
  }

  set terminal(terminal: any) {
    this.setTerminal(terminal);
    // return this.program.terminal;
  }

  get rows() {
    return this.program.rows;
  }

  get width() {
    return this.program.cols;
  }

  get height() {
    return this.program.rows;
  }

  get focused(): any {
    return this.history[this.history.length - 1];
  }

  set focused(el: any) {
    this.focusPush(el);
  }

  dattr = (0 << 18) | (0x1ff << 9) | 0x1ff;

  renders: number = 0;

  //   itop: number = 0;
  //   iright: number = 0;
  //   ibottom: number = 0;
  //   iheight: number = 0;
  //   iwidth: number = 0;

  padding = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  };

  hover: any = null;
  history: any[] = [];
  clickable: any[] = [];
  keyable: any[] = [];
  grabKeys: boolean = false;
  lockKeys: boolean = false;
  _buf: string = '';

  _ci: number = -1;
  debugLog: Log | undefined;
  options: any;
  _listenedMouse: any;
  _needsClickableSort: any;
  mouseDown: any;
  _listenedKeys: any;
  ignoreLocked: any;
  _hoverText: any;
  lines: any[] | undefined;
  olines: any[] | undefined;
  destroyed: any;
  _borderStops: any;
  dockBorders: any;
  tput: any;
  fullUnicode: any;
  _savedFocus: any;
  autoPadding: boolean;
  tabc: string;
  _unicode: any;
  position: any;

  constructor(options: any = {}) {
    super(options);
    if (options.rsety && options.listen) {
      options = { program: options };
    }

    const self = this;

    // if (!(this instanceof Node)) return new Screen(options);

    Screen.bind(this);

    this.program = options.program;

    if (!this.program) {
      this.program = new Program({
        input: options.input,
        output: options.output,
        log: options.log,
        debug: options.debug,
        dump: options.dump,
        terminal: options.terminal || options.term,
        resizeTimeout: options.resizeTimeout,
        forceUnicode: options.forceUnicode,
        tput: true,
        buffer: true,
        zero: true,
      });
    } else {
      this.program.setupTput();
      this.program.useBuffer = true;
      this.program.zero = true;
      this.program.options.resizeTimeout = options.resizeTimeout;
      if (options.forceUnicode != null) {
        this.program.tput.features.unicode = options.forceUnicode;
        this.program.tput.unicode = options.forceUnicode;
      }
    }

    this.tput = this.program.tput;

    this.autoPadding = options.autoPadding !== false;
    this.tabc = Array((options.tabSize || 4) + 1).join(' ');
    this.dockBorders = options.dockBorders;

    this.ignoreLocked = options.ignoreLocked || [];

    this._unicode = this.tput.unicode || this.tput.numbers.U8 === 1;
    this.fullUnicode = this.options.fullUnicode && this._unicode;

    this.position = {
      left: this.left = this.aleft = this.rleft = 0,
      right: this.right = this.aright = this.rright = 0,
      top: this.top = this.atop = this.rtop = 0,
      bottom: this.bottom = this.abottom = this.rbottom = 0,
      get height() {
        return self.height;
      },
      get width() {
        return self.width;
      },
    };

    if (options.title) {
      this.title = options.title;
    }

    options.cursor = options.cursor || {
      artificial: options.artificialCursor,
      shape: options.cursorShape,
      blink: options.cursorBlink,
      color: options.cursorColor,
    };

    this.cursor = {
      artificial: options.cursor.artificial || false,
      shape: options.cursor.shape || 'block',
      blink: options.cursor.blink || false,
      color: options.cursor.color || null,
      _set: false,
      _state: 1,
      _hidden: true,
    };

    this.program.on('resize', () => {
      self.alloc();
      self.render();
      (function emit(el) {
        el.emit('resize');
        // @ts-ignore
        el.children.forEach(emit);
      })(self);
    });

    this.program.on('focus', () => {
      self.emit('focus');
    });

    this.program.on('blur', () => {
      self.emit('blur');
    });

    this.program.on('warning', (text: string) => {
      self.emit('warning', text);
    });

    this.on('newListener', function fn(type: string) {
      if (
        type === 'keypress' ||
        type.indexOf('key ') === 0 ||
        type === 'mouse'
      ) {
        if (type === 'keypress' || type.indexOf('key ') === 0)
          self._listenKeys();
        if (type === 'mouse') self._listenMouse();
      }
      if (
        type === 'mouse' ||
        type === 'click' ||
        type === 'mouseover' ||
        type === 'mouseout' ||
        type === 'mousedown' ||
        type === 'mouseup' ||
        type === 'mousewheel' ||
        type === 'wheeldown' ||
        type === 'wheelup' ||
        type === 'mousemove'
      ) {
        self._listenMouse();
      }
    });

    this.setMaxListeners(Infinity);

    this.enter();

    this.postEnter();
  }

  left: number; 
  aleft: number; 
  rleft: number;
  right: number; 
  aright: number; 
  rright: number;
  top: number; 
  atop: number; 
  rtop: number;
  bottom: number; 
  abottom: number; 
  rbottom: number;

  setTerminal(terminal: any) {
    const entered = !!this.program.isAlt;
    if (entered) {
      this._buf = '';
      this.program._buf = '';
      this.leave();
    }
    this.program.setTerminal(terminal);
    this.tput = this.program.tput;
    if (entered) {
      this.enter();
    }
  }

  enter() {
    if (this.program.isAlt) return;
    if (!this.cursor._set) {
      if (this.options.cursor.shape) {
        this.cursorShape(this.cursor.shape, this.cursor.blink);
      }
      if (this.options.cursor.color) {
        this.cursorColor(this.cursor.color);
      }
    }
    if (process.platform === 'win32') {
      try {
        cp.execSync('cls', { stdio: 'ignore', timeout: 1000 });
      } catch (e) {}
    }
    this.program.alternateBuffer();
    this.program.put.keypad_xmit();
    this.program.csr(0, this.height - 1);
    this.program.hideCursor();
    this.program.cup(0, 0);
    // We need this for tmux now:
    if (this.tput.strings.ena_acs) {
      this.program._write(this.tput.enacs());
    }
    this.alloc();
  }

  leave() {
    if (!this.program.isAlt) return;
    this.program.put.keypad_local();
    if (
      this.program.scrollTop !== 0 ||
      this.program.scrollBottom !== this.rows - 1
    ) {
      this.program.csr(0, this.height - 1);
    }
    // XXX For some reason if alloc/clear() is before this
    // line, it doesn't work on linux console.
    this.program.showCursor();
    this.alloc();
    // @ts-ignore
    if (this._listenedMouse) {
      this.program.disableMouse();
    }
    this.program.normalBuffer();
    if (this.cursor._set) this.cursorReset();
    this.program.flush();
    if (process.platform === 'win32') {
      try {
        cp.execSync('cls', { stdio: 'ignore', timeout: 1000 });
      } catch (e) {}
    }
  }

  postEnter() {
    const self = this;
    if (this.options.debug) {
      this.debugLog = new Log({
        screen: this,
        parent: this,
        hidden: true,
        draggable: true,
        left: 'center',
        top: 'center',
        width: '30%',
        height: '30%',
        border: 'line',
        label: ' {bold}Debug Log{/bold} ',
        tags: true,
        keys: true,
        vi: true,
        mouse: true,
        scrollbar: {
          ch: ' ',
          track: {
            bg: 'yellow',
          },
          style: {
            inverse: true,
          },
        },
      });

      this.debugLog.toggle = () => {
        if (self.debugLog!.hidden) {
          self.saveFocus();
          self.debugLog!.show();
          self.debugLog!.setFront();
          self.debugLog!.focus();
        } else {
          self.debugLog!.hide();
          self.restoreFocus();
        }
        self.render();
      };

      this.debugLog.key(['q', 'escape'], self.debugLog!.toggle);
      this.key('f12', self.debugLog!.toggle);
    }

    if (this.options.warnings) {
      this.on('warning', (text: string) => {
        const warning = new Box({
          screen: self,
          parent: self,
          left: 'center',
          top: 'center',
          width: 'shrink',
          padding: 1,
          height: 'shrink',
          align: 'center',
          valign: 'middle',
          border: 'line',
          label: ' {red-fg}{bold}WARNING{/} ',
          content: `{bold}${text}{/bold}`,
          tags: true,
        });
        self.render();
        const timeout = setTimeout(() => {
          warning.destroy();
          self.render();
        }, 1500);
        if (timeout.unref) {
          timeout.unref();
        }
      });
    }
  }

  destroy() {
    this.leave();

    const index = Screen.instances.indexOf(this);
    if (~index) {
      Screen.instances.splice(index, 1);
      Screen.total--;

      Screen.global = Screen.instances[0];

      if (Screen.total === 0) {
        Screen.global = null;

        process.removeListener('uncaughtException', Screen._exceptionHandler);
        // @ts-ignore
        process.removeListener('SIGTERM', Screen._sigtermHandler);
        // @ts-ignore
        process.removeListener('SIGINT', Screen._sigintHandler);
        // @ts-ignore
        process.removeListener('SIGQUIT', Screen._sigquitHandler);
        // @ts-ignore
        process.removeListener('exit', Screen._exitHandler);
        delete Screen._exceptionHandler;
        // @ts-ignore
        delete Screen._sigtermHandler;
        // @ts-ignore
        delete Screen._sigintHandler;
        // @ts-ignore
        delete Screen._sigquitHandler;
        // @ts-ignore
        delete Screen._exitHandler;

        delete Screen._bound;
      }

      this.destroyed = true;
      this.emit('destroy');
      this._destroy();
    }

    this.program.destroy();
  }

  log(...args: any[]) {
    return this.program.log.apply(this.program, args);
  }

  debug(...args: any[]) {
    if (this.debugLog) {
      this.debugLog.log.apply(this.debugLog, args);
    }
    return this.program.debug.apply(this.program, args);
  }

  _listenMouse(el?: any) {
    const self = this;

    if (el && !~this.clickable.indexOf(el)) {
      el.clickable = true;
      this.clickable.push(el);
    }

    if (this._listenedMouse) return;
    this._listenedMouse = true;

    this.program.enableMouse();
    if (this.options.sendFocus) {
      this.program.setMouse({ sendFocus: true }, true);
    }

    this.on('render', () => {
      self._needsClickableSort = true;
    });

    this.program.on('mouse', (data: any) => {
      if (self.lockKeys) return;

      if (self._needsClickableSort) {
        self.clickable = helpers.hsort(self.clickable);
        self._needsClickableSort = false;
      }

      let i = 0;
      let el;
      let set;
      let pos;

      for (; i < self.clickable.length; i++) {
        el = self.clickable[i];

        if (el.detached || !el.visible) {
          continue;
        }

        // if (self.grabMouse && self.focused !== el
        //     && !el.hasAncestor(self.focused)) continue;

        pos = el.lpos;
        if (!pos) continue;

        if (
          data.x >= pos.xi &&
          data.x < pos.xl &&
          data.y >= pos.yi &&
          data.y < pos.yl
        ) {
          el.emit('mouse', data);
          if (data.action === 'mousedown') {
            self.mouseDown = el;
          } else if (data.action === 'mouseup') {
            (self.mouseDown || el).emit('click', data);
            self.mouseDown = null;
          } else if (data.action === 'mousemove') {
            if (self.hover && el.index > self.hover.index) {
              set = false;
            }
            if (self.hover !== el && !set) {
              if (self.hover) {
                self.hover.emit('mouseout', data);
              }
              el.emit('mouseover', data);
              self.hover = el;
            }
            set = true;
          }
          el.emit(data.action, data);
          break;
        }
      }

      // Just mouseover?
      if (
        (data.action === 'mousemove' ||
          data.action === 'mousedown' ||
          data.action === 'mouseup') &&
        self.hover &&
        !set
      ) {
        self.hover.emit('mouseout', data);
        self.hover = null;
      }

      self.emit('mouse', data);
      self.emit(data.action, data);
    });

    // Autofocus highest element.
    // this.on('element click', function(el, data) {
    //   var target;
    //   do {
    //     if (el.clickable === true && el.options.autoFocus !== false) {
    //       target = el;
    //     }
    //   } while (el = el.parent);
    //   if (target) target.focus();
    // });

    // Autofocus elements with the appropriate option.
    this.on('element click', (el: any) => {
      if (el.clickable === true && el.options.autoFocus !== false) {
        el.focus();
      }
    });
  }

  enableMouse(el: any) {
    this._listenMouse(el);
  }

  _listenKeys(el?: any) {
    const self = this;

    if (el && !~this.keyable.indexOf(el)) {
      el.keyable = true;
      this.keyable.push(el);
    }

    if (this._listenedKeys) return;
    this._listenedKeys = true;

    // NOTE: The event emissions used to be reversed:
    // element + screen
    // They are now:
    // screen + element
    // After the first keypress emitted, the handler
    // checks to make sure grabKeys, lockKeys, and focused
    // weren't changed, and handles those situations appropriately.
    this.program.on('keypress', (ch: any, key: any) => {
      if (self.lockKeys && !~self.ignoreLocked.indexOf(key.full)) {
        return;
      }

      const focused = self.focused;
      const grabKeys = self.grabKeys;

      if (!grabKeys || ~self.ignoreLocked.indexOf(key.full)) {
        self.emit('keypress', ch, key);
        self.emit(`key ${key.full}`, ch, key);
      }

      // If something changed from the screen key handler, stop.
      if (self.grabKeys !== grabKeys || self.lockKeys) {
        return;
      }

      if (focused && focused.keyable) {
        focused.emit('keypress', ch, key);
        focused.emit(`key ${key.full}`, ch, key);
      }
    });
  }

  enableKeys(el: any) {
    this._listenKeys(el);
  }

  enableInput(el: any) {
    this._listenMouse(el);
    this._listenKeys(el);
  }

  _initHover() {
    const self = this;

    if (this._hoverText) {
      return;
    }

    this._hoverText = new Box({
      screen: this,
      left: 0,
      top: 0,
      tags: false,
      height: 'shrink',
      width: 'shrink',
      border: 'line',
      style: {
        border: {
          fg: 'default',
        },
        bg: 'default',
        fg: 'default',
      },
    });

    this.on('mousemove', ({ x, y }: any) => {
      if (self._hoverText.detached) return;
      self._hoverText.rleft = x + 1;
      self._hoverText.rtop = y;
      self.render();
    });

    this.on(
      'element mouseover',
      ({ _hoverOptions, parseTags }: any, { x, y }: any) => {
        if (!_hoverOptions) return;
        self._hoverText.parseTags = parseTags;
        self._hoverText.setContent(_hoverOptions.text);
        self.append(self._hoverText);
        self._hoverText.rleft = x + 1;
        self._hoverText.rtop = y;
        self.render();
      },
    );

    this.on('element mouseout', () => {
      if (self._hoverText.detached) return;
      self._hoverText.detach();
      self.render();
    });

    // XXX This can cause problems if the
    // terminal does not support allMotion.
    // Workaround: check to see if content is set.
    this.on('element mouseup', ({ _hoverOptions }: any) => {
      if (!self._hoverText.getContent()) return;
      if (!_hoverOptions) return;
      self.append(self._hoverText);
      self.render();
    });
  }

  alloc(dirty?: any) {
    let x;
    let y;

    this.lines = [];
    for (y = 0; y < this.rows; y++) {
      this.lines[y] = [];
      for (x = 0; x < this.cols; x++) {
        this.lines[y][x] = [this.dattr, ' '];
      }
      this.lines[y].dirty = !!dirty;
    }

    this.olines = [];
    for (y = 0; y < this.rows; y++) {
      this.olines[y] = [];
      for (x = 0; x < this.cols; x++) {
        this.olines[y][x] = [this.dattr, ' '];
      }
    }

    this.program.clear();
  }

  realloc() {
    return this.alloc(true);
  }

  render() {
    const self = this;

    if (this.destroyed) return;

    this.emit('prerender');

    this._borderStops = {};

    // TODO: Possibly get rid of .dirty altogether.
    // TODO: Could possibly drop .dirty and just clear the `lines` buffer every
    // time before a screen.render. This way clearRegion doesn't have to be
    // called in arbitrary places for the sake of clearing a spot where an
    // element used to be (e.g. when an element moves or is hidden). There could
    // be some overhead though.
    // this.screen.clearRegion(0, this.cols, 0, this.rows);
    this._ci = 0;
    this.children.forEach(el => {
      el.index = self._ci++;
      //el._rendering = true;
      el.render();
      //el._rendering = false;
    });
    this._ci = -1;

    if (this.screen!.dockBorders) {
      this._dockBorders();
    }

    this.draw(0, this.lines!.length - 1);

    // XXX Workaround to deal with cursor pos before the screen has rendered and
    // lpos is not reliable (stale).
    if (this.focused && this.focused._updateCursor) {
      this.focused._updateCursor(true);
    }

    this.renders++;

    this.emit('render');
  }

  blankLine(ch?: any, dirty?: any) {
    const out: any = [];
    for (let x = 0; x < this.cols; x++) {
      out[x] = [this.dattr, ch || ' '];
    }
    out.dirty = dirty;
    return out;
  }

  insertLine(n: number, y: number, top: number, bottom: number) {
    // if (y === top) return this.insertLineNC(n, y, top, bottom);

    if (
      !this.tput.strings.change_scroll_region ||
      !this.tput.strings.delete_line ||
      !this.tput.strings.insert_line
    )
      return;

    this._buf += this.tput.csr(top, bottom);
    this._buf += this.tput.cup(y, 0);
    this._buf += this.tput.il(n);
    this._buf += this.tput.csr(0, this.height - 1);

    const j = bottom + 1;

    while (n--) {
      this.lines!.splice(y, 0, this.blankLine());
      this.lines!.splice(j, 1);
      this.olines!.splice(y, 0, this.blankLine());
      this.olines!.splice(j, 1);
    }
  }

  deleteLine(n: number, y: number, top: number, bottom: number) {
    // if (y === top) return this.deleteLineNC(n, y, top, bottom);

    if (
      !this.tput.strings.change_scroll_region ||
      !this.tput.strings.delete_line ||
      !this.tput.strings.insert_line
    )
      return;

    this._buf += this.tput.csr(top, bottom);
    this._buf += this.tput.cup(y, 0);
    this._buf += this.tput.dl(n);
    this._buf += this.tput.csr(0, this.height - 1);

    const j = bottom + 1;

    while (n--) {
      this.lines!.splice(j, 0, this.blankLine());
      this.lines!.splice(y, 1);
      this.olines!.splice(j, 0, this.blankLine());
      this.olines!.splice(y, 1);
    }
  }

  // This is how ncurses does it.
  // Scroll down (up cursor-wise).
  // This will only work for top line deletion as opposed to arbitrary lines.
  insertLineNC(n: number, y: number, top: number, bottom: number) {
    if (
      !this.tput.strings.change_scroll_region ||
      !this.tput.strings.delete_line
    )
      return;

    this._buf += this.tput.csr(top, bottom);
    this._buf += this.tput.cup(top, 0);
    this._buf += this.tput.dl(n);
    this._buf += this.tput.csr(0, this.height - 1);

    const j = bottom + 1;

    while (n--) {
      this.lines!.splice(j, 0, this.blankLine());
      this.lines!.splice(y, 1);
      this.olines!.splice(j, 0, this.blankLine());
      this.olines!.splice(y, 1);
    }
  }

  // This is how ncurses does it.
  // Scroll up (down cursor-wise).
  // This will only work for bottom line deletion as opposed to arbitrary lines.
  deleteLineNC(n: number, y: number, top: number, bottom: number) {
    if (
      !this.tput.strings.change_scroll_region ||
      !this.tput.strings.delete_line
    )
      return;

    this._buf += this.tput.csr(top, bottom);
    this._buf += this.tput.cup(bottom, 0);
    this._buf += Array(n + 1).join('\n');
    this._buf += this.tput.csr(0, this.height - 1);

    const j = bottom + 1;

    while (n--) {
      if (this.lines) {
        this.lines.splice(j, 0, this.blankLine());
        this.lines.splice(y, 1);
      }
      if (this.olines) {
        this.olines.splice(j, 0, this.blankLine());
        this.olines.splice(y, 1);
      }
    }
  }

  insertBottom(top: any, bottom: any) {
    return this.deleteLine(1, top, top, bottom);
  }

  insertTop(top: any, bottom: any) {
    return this.insertLine(1, top, top, bottom);
  }

  deleteBottom(top: any, bottom: any) {
    return this.clearRegion(0, this.width, bottom, bottom);
  }

  deleteTop(top: any, bottom: any) {
    // Same as: return this.insertBottom(top, bottom);
    return this.deleteLine(1, top, top, bottom);
  }

  // Parse the sides of an element to determine
  // whether an element has uniform cells on
  // both sides. If it does, we can use CSR to
  // optimize scrolling on a scrollable element.
  // Not exactly sure how worthwile this is.
  // This will cause a performance/cpu-usage hit,
  // but will it be less or greater than the
  // performance hit of slow-rendering scrollable
  // boxes with clean sides?
  cleanSides({ lpos, itop, ibottom }: any) {
    const pos = lpos;

    if (!pos) {
      return false;
    }

    if (pos._cleanSides != null) {
      return pos._cleanSides;
    }

    if (pos.xi <= 0 && pos.xl >= this.width) {
      return (pos._cleanSides = true);
    }

    if (this.options.fastCSR) {
      // Maybe just do this instead of parsing.
      if (pos.yi < 0) return (pos._cleanSides = false);
      if (pos.yl > this.height) return (pos._cleanSides = false);
      if (this.width - (pos.xl - pos.xi) < 40) {
        return (pos._cleanSides = true);
      }
      return (pos._cleanSides = false);
    }

    if (!this.options.smartCSR) {
      return false;
    }

    // The scrollbar can't update properly, and there's also a
    // chance that the scrollbar may get moved around senselessly.
    // NOTE: In pratice, this doesn't seem to be the case.
    // if (this.scrollbar) {
    //   return pos._cleanSides = false;
    // }

    // Doesn't matter if we're only a height of 1.
    // if ((pos.yl - el.ibottom) - (pos.yi + el.itop) <= 1) {
    //   return pos._cleanSides = false;
    // }

    const yi = pos.yi + itop;

    const yl = pos.yl - ibottom;
    let first;
    let ch;
    let x;
    let y;

    if (pos.yi < 0) return (pos._cleanSides = false);
    if (pos.yl > this.height) return (pos._cleanSides = false);
    if (pos.xi - 1 < 0) return (pos._cleanSides = true);
    if (pos.xl > this.width) return (pos._cleanSides = true);

    for (x = pos.xi - 1; x >= 0; x--) {
      if (!this.olines![yi]) break;
      first = this.olines![yi][x];
      for (y = yi; y < yl; y++) {
        if (!this.olines![y] || !this.olines![y][x]) break;
        ch = this.olines![y][x];
        if (ch[0] !== first[0] || ch[1] !== first[1]) {
          return (pos._cleanSides = false);
        }
      }
    }

    for (x = pos.xl; x < this.width; x++) {
      if (!this.olines![yi]) break;
      first = this.olines![yi][x];
      for (y = yi; y < yl; y++) {
        if (!this.olines![y] || !this.olines![y][x]) break;
        ch = this.olines![y][x];
        if (ch[0] !== first[0] || ch[1] !== first[1]) {
          return (pos._cleanSides = false);
        }
      }
    }

    return (pos._cleanSides = true);
  }

  _dockBorders() {
    const lines = this.lines;
    let stops = this._borderStops;
    let i;
    let y;
    let x;
    let ch;

    // var keys, stop;
    //
    // keys = Object.keys(this._borderStops)
    //   .map(function(k) { return +k; })
    //   .sort(function(a, b) { return a - b; });
    //
    // for (i = 0; i < keys.length; i++) {
    //   y = keys[i];
    //   if (!lines[y]) continue;
    //   stop = this._borderStops[y];
    //   for (x = stop.xi; x < stop.xl; x++) {

    stops = Object.keys(stops)
      .map(k => +k)
      .sort((a, b) => a - b);

    for (i = 0; i < stops.length; i++) {
      y = stops[i];
      if (!lines![y]) continue;
      for (x = 0; x < this.width; x++) {
        ch = lines![y][x][1];
        // @ts-ignore
        if (angles[ch]) {
          lines![y][x][1] = this._getAngle(lines, x, y);
          lines![y].dirty = true;
        }
      }
    }
  }

  _getAngle(lines: any, x: any, y: any) {
    let angle = 0;
    const attr = lines[y][x][0];
    const ch = lines[y][x][1];

    // @ts-ignore
    if (lines[y][x - 1] && langles[lines[y][x - 1][1]]) {
      if (!this.options.ignoreDockContrast) {
        if (lines[y][x - 1][0] !== attr) return ch;
      }
      angle |= 1 << 3;
    }

    // @ts-ignore
    if (lines[y - 1] && uangles[lines[y - 1][x][1]]) {
      if (!this.options.ignoreDockContrast) {
        if (lines[y - 1][x][0] !== attr) return ch;
      }
      angle |= 1 << 2;
    }

    // @ts-ignore
    if (lines[y][x + 1] && rangles[lines[y][x + 1][1]]) {
      if (!this.options.ignoreDockContrast) {
        if (lines[y][x + 1][0] !== attr) return ch;
      }
      angle |= 1 << 1;
    }

    // @ts-ignore
    if (lines[y + 1] && dangles[lines[y + 1][x][1]]) {
      if (!this.options.ignoreDockContrast) {
        if (lines[y + 1][x][0] !== attr) return ch;
      }
      angle |= 1 << 0;
    }

    // Experimental: fixes this situation:
    // +----------+
    //            | <-- empty space here, should be a T angle
    // +-------+  |
    // |       |  |
    // +-------+  |
    // |          |
    // +----------+
    // if (uangles[lines[y][x][1]]) {
    //   if (lines[y + 1] && cdangles[lines[y + 1][x][1]]) {
    //     if (!this.options.ignoreDockContrast) {
    //       if (lines[y + 1][x][0] !== attr) return ch;
    //     }
    //     angle |= 1 << 0;
    //   }
    // }

    // @ts-ignore
    return angleTable[angle] || ch;
  }

  draw(start: any, end: any) {
    // this.emit('predraw');

    let x;

    let y;
    let line;
    let out;
    let ch;
    let data;
    let attr;
    let fg;
    let bg;
    let flags;
    let main = '';
    let pre;
    let post;
    let clr;
    let neq;
    let xx;
    let lx = -1;
    let ly = -1;
    let o;

    let acs;

    if (this._buf) {
      main += this._buf;
      this._buf = '';
    }

    for (y = start; y <= end; y++) {
      line = this.lines![y];
      o = this.olines![y];

      if (!line.dirty && !(this.cursor.artificial && y === this.program.y)) {
        continue;
      }
      line.dirty = false;

      out = '';
      attr = this.dattr;

      for (x = 0; x < line.length; x++) {
        data = line[x][0];
        ch = line[x][1];

        // Render the artificial cursor.
        if (
          this.cursor.artificial &&
          !this.cursor._hidden &&
          this.cursor._state &&
          x === this.program.x &&
          y === this.program.y
        ) {
          const cattr = this._cursorAttr(this.cursor, data);
          if (cattr.ch) ch = cattr.ch;
          data = cattr.attr;
        }

        // Take advantage of xterm's back_color_erase feature by using a
        // lookahead. Stop spitting out so many damn spaces. NOTE: Is checking
        // the bg for non BCE terminals worth the overhead?
        if (
          this.options.useBCE &&
          ch === ' ' &&
          (this.tput.bools.back_color_erase ||
            (data & 0x1ff) === (this.dattr & 0x1ff)) &&
          ((data >> 18) & 8) === ((this.dattr >> 18) & 8)
        ) {
          clr = true;
          neq = false;

          for (xx = x; xx < line.length; xx++) {
            if (line[xx][0] !== data || line[xx][1] !== ' ') {
              clr = false;
              break;
            }
            if (line[xx][0] !== o[xx][0] || line[xx][1] !== o[xx][1]) {
              neq = true;
            }
          }

          if (clr && neq) {
            (lx = -1), (ly = -1);
            if (data !== attr) {
              out += this.codeAttr(data);
              attr = data;
            }
            out += this.tput.cup(y, x);
            out += this.tput.el();
            for (xx = x; xx < line.length; xx++) {
              o[xx][0] = data;
              o[xx][1] = ' ';
            }
            break;
          }

          // If there's more than 10 spaces, use EL regardless
          // and start over drawing the rest of line. Might
          // not be worth it. Try to use ECH if the terminal
          // supports it. Maybe only try to use ECH here.
          // //if (this.tput.strings.erase_chars)
          // if (!clr && neq && (xx - x) > 10) {
          //   lx = -1, ly = -1;
          //   if (data !== attr) {
          //     out += this.codeAttr(data);
          //     attr = data;
          //   }
          //   out += this.tput.cup(y, x);
          //   if (this.tput.strings.erase_chars) {
          //     // Use erase_chars to avoid erasing the whole line.
          //     out += this.tput.ech(xx - x);
          //   } else {
          //     out += this.tput.el();
          //   }
          //   if (this.tput.strings.parm_right_cursor) {
          //     out += this.tput.cuf(xx - x);
          //   } else {
          //     out += this.tput.cup(y, xx);
          //   }
          //   this.fillRegion(data, ' ',
          //     x, this.tput.strings.erase_chars ? xx : line.length,
          //     y, y + 1);
          //   x = xx - 1;
          //   continue;
          // }

          // Skip to the next line if the
          // rest of the line is already drawn.
          // if (!neq) {
          //   for (; xx < line.length; xx++) {
          //     if (line[xx][0] !== o[xx][0] || line[xx][1] !== o[xx][1]) {
          //       neq = true;
          //       break;
          //     }
          //   }
          //   if (!neq) {
          //     attr = data;
          //     break;
          //   }
          // }
        }

        // Optimize by comparing the real output
        // buffer to the pending output buffer.
        if (data === o[x][0] && ch === o[x][1]) {
          if (lx === -1) {
            lx = x;
            ly = y;
          }
          continue;
        } else if (lx !== -1) {
          if (this.tput.strings.parm_right_cursor) {
            out += y === ly ? this.tput.cuf(x - lx) : this.tput.cup(y, x);
          } else {
            out += this.tput.cup(y, x);
          }
          (lx = -1), (ly = -1);
        }
        o[x][0] = data;
        o[x][1] = ch;

        if (data !== attr) {
          if (attr !== this.dattr) {
            out += '\x1b[m';
          }
          if (data !== this.dattr) {
            out += '\x1b[';

            bg = data & 0x1ff;
            fg = (data >> 9) & 0x1ff;
            flags = data >> 18;

            // bold
            if (flags & 1) {
              out += '1;';
            }

            // underline
            if (flags & 2) {
              out += '4;';
            }

            // blink
            if (flags & 4) {
              out += '5;';
            }

            // inverse
            if (flags & 8) {
              out += '7;';
            }

            // invisible
            if (flags & 16) {
              out += '8;';
            }

            if (bg !== 0x1ff) {
              bg = this._reduceColor(bg);
              if (bg < 16) {
                if (bg < 8) {
                  bg += 40;
                } else if (bg < 16) {
                  bg -= 8;
                  bg += 100;
                }
                out += `${bg};`;
              } else {
                out += `48;5;${bg};`;
              }
            }

            if (fg !== 0x1ff) {
              fg = this._reduceColor(fg);
              if (fg < 16) {
                if (fg < 8) {
                  fg += 30;
                } else if (fg < 16) {
                  fg -= 8;
                  fg += 90;
                }
                out += `${fg};`;
              } else {
                out += `38;5;${fg};`;
              }
            }

            if (out[out.length - 1] === ';') out = out.slice(0, -1);

            out += 'm';
          }
        }

        // If we find a double-width char, eat the next character which should be
        // a space due to parseContent's behavior.
        if (this.fullUnicode) {
          // If this is a surrogate pair double-width char, we can ignore it
          // because parseContent already counted it as length=2.
          if (unicode.charWidth(line[x][1]) === 2) {
            // NOTE: At cols=44, the bug that is avoided
            // by the angles check occurs in widget-unicode:
            // Might also need: `line[x + 1][0] !== line[x][0]`
            // for borderless boxes?
            // @ts-ignore
            if (x === line.length - 1 || angles[line[x + 1][1]]) {
              // If we're at the end, we don't have enough space for a
              // double-width. Overwrite it with a space and ignore.
              ch = ' ';
              o[x][1] = '\0';
            } else {
              // ALWAYS refresh double-width chars because this special cursor
              // behavior is needed. There may be a more efficient way of doing
              // this. See above.
              o[x][1] = '\0';
              // Eat the next character by moving forward and marking as a
              // space (which it is).
              o[++x][1] = '\0';
            }
          }
        }

        // Attempt to use ACS for supported characters.
        // This is not ideal, but it's how ncurses works.
        // There are a lot of terminals that support ACS
        // *and UTF8, but do not declare U8. So ACS ends
        // up being used (slower than utf8). Terminals
        // that do not support ACS and do not explicitly
        // support UTF8 get their unicode characters
        // replaced with really ugly ascii characters.
        // It is possible there is a terminal out there
        // somewhere that does not support ACS, but
        // supports UTF8, but I imagine it's unlikely.
        // Maybe remove !this.tput.unicode check, however,
        // this seems to be the way ncurses does it.
        if (
          this.tput.strings.enter_alt_charset_mode &&
          !this.tput.brokenACS &&
          (this.tput.acscr[ch] || acs)
        ) {
          // Fun fact: even if this.tput.brokenACS wasn't checked here,
          // the linux console would still work fine because the acs
          // table would fail the check of: this.tput.acscr[ch]
          if (this.tput.acscr[ch]) {
            if (acs) {
              ch = this.tput.acscr[ch];
            } else {
              ch = this.tput.smacs() + this.tput.acscr[ch];
              acs = true;
            }
          } else if (acs) {
            ch = this.tput.rmacs() + ch;
            acs = false;
          }
        } else {
          // U8 is not consistently correct. Some terminfo's
          // terminals that do not declare it may actually
          // support utf8 (e.g. urxvt), but if the terminal
          // does not declare support for ACS (and U8), chances
          // are it does not support UTF8. This is probably
          // the "safest" way to do this. Should fix things
          // like sun-color.
          // NOTE: It could be the case that the $LANG
          // is all that matters in some cases:
          // if (!this.tput.unicode && ch > '~') {
          if (!this.tput.unicode && this.tput.numbers.U8 !== 1 && ch > '~') {
            ch = this.tput.utoa[ch] || '?';
          }
        }

        out += ch;
        attr = data;
      }

      if (attr !== this.dattr) {
        out += '\x1b[m';
      }

      if (out) {
        main += this.tput.cup(y, 0) + out;
      }
    }

    if (acs) {
      main += this.tput.rmacs();
      acs = false;
    }

    if (main) {
      pre = '';
      post = '';

      pre += this.tput.sc();
      post += this.tput.rc();

      if (!this.program.cursorHidden) {
        pre += this.tput.civis();
        post += this.tput.cnorm();
      }

      // this.program.flush();
      // this.program._owrite(pre + main + post);
      this.program._write(pre + main + post);
    }

    // this.emit('draw');
  }

  _reduceColor(color: any) {
    return colors.reduce(color, this.tput.colors);
  }

  // Convert an SGR string to our own attribute format.
  attrCode(code: any, cur: any, def: any) {
    let flags = (cur >> 18) & 0x1ff;
    let fg = (cur >> 9) & 0x1ff;
    let bg = cur & 0x1ff;
    let c;
    let i;

    code = code.slice(2, -1).split(';');
    if (!code[0]) code[0] = '0';

    for (i = 0; i < code.length; i++) {
      c = +code[i] || 0;
      switch (c) {
        case 0: // normal
          bg = def & 0x1ff;
          fg = (def >> 9) & 0x1ff;
          flags = (def >> 18) & 0x1ff;
          break;
        case 1: // bold
          flags |= 1;
          break;
        case 22:
          flags = (def >> 18) & 0x1ff;
          break;
        case 4: // underline
          flags |= 2;
          break;
        case 24:
          flags = (def >> 18) & 0x1ff;
          break;
        case 5: // blink
          flags |= 4;
          break;
        case 25:
          flags = (def >> 18) & 0x1ff;
          break;
        case 7: // inverse
          flags |= 8;
          break;
        case 27:
          flags = (def >> 18) & 0x1ff;
          break;
        case 8: // invisible
          flags |= 16;
          break;
        case 28:
          flags = (def >> 18) & 0x1ff;
          break;
        case 39: // default fg
          fg = (def >> 9) & 0x1ff;
          break;
        case 49: // default bg
          bg = def & 0x1ff;
          break;
        case 100: // default fg/bg
          fg = (def >> 9) & 0x1ff;
          bg = def & 0x1ff;
          break;
        default:
          // color
          if (c === 48 && +code[i + 1] === 5) {
            i += 2;
            bg = +code[i];
            break;
          } else if (c === 48 && +code[i + 1] === 2) {
            i += 2;
            bg = colors.match(+code[i], +code[i + 1], +code[i + 2]);
            if (bg === -1) bg = def & 0x1ff;
            i += 2;
            break;
          } else if (c === 38 && +code[i + 1] === 5) {
            i += 2;
            fg = +code[i];
            break;
          } else if (c === 38 && +code[i + 1] === 2) {
            i += 2;
            fg = colors.match(+code[i], +code[i + 1], +code[i + 2]);
            if (fg === -1) fg = (def >> 9) & 0x1ff;
            i += 2;
            break;
          }
          if (c >= 40 && c <= 47) {
            bg = c - 40;
          } else if (c >= 100 && c <= 107) {
            bg = c - 100;
            bg += 8;
          } else if (c === 49) {
            bg = def & 0x1ff;
          } else if (c >= 30 && c <= 37) {
            fg = c - 30;
          } else if (c >= 90 && c <= 97) {
            fg = c - 90;
            fg += 8;
          } else if (c === 39) {
            fg = (def >> 9) & 0x1ff;
          } else if (c === 100) {
            fg = (def >> 9) & 0x1ff;
            bg = def & 0x1ff;
          }
          break;
      }
    }

    return (flags << 18) | (fg << 9) | bg;
  }

  // Convert our own attribute format to an SGR string.
  codeAttr(code: any) {
    const flags = (code >> 18) & 0x1ff;
    let fg = (code >> 9) & 0x1ff;
    let bg = code & 0x1ff;
    let out = '';

    // bold
    if (flags & 1) {
      out += '1;';
    }

    // underline
    if (flags & 2) {
      out += '4;';
    }

    // blink
    if (flags & 4) {
      out += '5;';
    }

    // inverse
    if (flags & 8) {
      out += '7;';
    }

    // invisible
    if (flags & 16) {
      out += '8;';
    }

    if (bg !== 0x1ff) {
      bg = this._reduceColor(bg);
      if (bg < 16) {
        if (bg < 8) {
          bg += 40;
        } else if (bg < 16) {
          bg -= 8;
          bg += 100;
        }
        out += `${bg};`;
      } else {
        out += `48;5;${bg};`;
      }
    }

    if (fg !== 0x1ff) {
      fg = this._reduceColor(fg);
      if (fg < 16) {
        if (fg < 8) {
          fg += 30;
        } else if (fg < 16) {
          fg -= 8;
          fg += 90;
        }
        out += `${fg};`;
      } else {
        out += `38;5;${fg};`;
      }
    }

    if (out[out.length - 1] === ';') out = out.slice(0, -1);

    return `\x1b[${out}m`;
  }

  focusOffset(offset: any) {
    const shown = this.keyable.filter(
      ({ detached, visible }) => !detached && visible,
    ).length;

    if (!shown || !offset) {
      return;
    }

    let i = this.keyable.indexOf(this.focused);
    if (!~i) return;

    if (offset > 0) {
      while (offset--) {
        if (++i > this.keyable.length - 1) i = 0;
        if (this.keyable[i].detached || !this.keyable[i].visible) offset++;
      }
    } else {
      offset = -offset;
      while (offset--) {
        if (--i < 0) i = this.keyable.length - 1;
        if (this.keyable[i].detached || !this.keyable[i].visible) offset++;
      }
    }

    return this.keyable[i].focus();
  }

  focusNext() {
    return this.focusOffset(1);
  }

  focusPush(el: any) {
    if (!el) return;
    const old = this.history[this.history.length - 1];
    if (this.history.length === 10) {
      this.history.shift();
    }
    this.history.push(el);
    this._focus(el, old);
  }

  focusPop() {
    const old = this.history.pop();
    if (this.history.length) {
      this._focus(this.history[this.history.length - 1], old);
    }
    return old;
  }

  saveFocus() {
    return (this._savedFocus = this.focused);
  }

  restoreFocus() {
    if (!this._savedFocus) return;
    this._savedFocus.focus();
    delete this._savedFocus;
    return this.focused;
  }

  rewindFocus() {
    const old = this.history.pop();
    let el;

    while (this.history.length) {
      el = this.history.pop();
      if (!el.detached && el.visible) {
        this.history.push(el);
        this._focus(el, old);
        return el;
      }
    }

    if (old) {
      old.emit('blur');
    }
  }

  // @ts-ignore
  _focus(self, old) {
    // Find a scrollable ancestor if we have one.
    let el = self;
    while ((el = el.parent)) {
      if (el.scrollable) break;
    }

    // If we're in a scrollable element,
    // automatically scroll to the focused element.
    if (el && !el.detached) {
      // NOTE: This is different from the other "visible" values - it needs the
      // visible height of the scrolling element itself, not the element within
      // it.
      const visible =
        self.screen.height - el.atop - el.itop - el.abottom - el.ibottom;
      if (self.rtop < el.childBase) {
        el.scrollTo(self.rtop);
        self.screen.render();
      } else if (
        self.rtop + self.height - self.ibottom >
        el.childBase + visible
      ) {
        // Explanation for el.itop here: takes into account scrollable elements
        // with borders otherwise the element gets covered by the bottom border:
        el.scrollTo(self.rtop - (el.height - self.height) + el.itop, true);
        self.screen.render();
      }
    }

    if (old) {
      old.emit('blur', self);
    }

    self.emit('focus', old);
  }

  clearRegion(
    xi: number,
    xl: number,
    yi: number,
    yl: number,
    override?: boolean,
  ) {
    return this.fillRegion(this.dattr, ' ', xi, xl, yi, yl, override);
  }

  fillRegion(
    attr: any,
    ch: any,
    xi: number,
    xl: number,
    yi: number,
    yl: number,
    override?: boolean,
  ) {
    const { lines } = this;
    let cell;
    let xx;

    if (xi < 0) xi = 0;
    if (yi < 0) yi = 0;

    for (; yi < yl; yi++) {
      if (!lines![yi]) break;
      for (xx = xi; xx < xl; xx++) {
        // @ts-ignore
        cell = lines[yi][xx];
        if (!cell) break;
        if (override || attr !== cell[0] || ch !== cell[1]) {
          lines![yi][xx][0] = attr;
          lines![yi][xx][1] = ch;
          lines![yi].dirty = true;
        }
      }
    }
  }

  key(...args: any[]) {
    return this.program.key.apply(this, args);
  }

  onceKey(...args: any[]) {
    return this.program.onceKey.apply(this, args);
  }

  spawn(file: string, args: any, options: any = {}) {
    if (!Array.isArray(args)) {
      options = args;
      args = [];
    }

    const screen = this;
    const program = screen.program;
    const spawn = require('child_process').spawn;
    const mouse = program.mouseEnabled;
    let ps;

    options.stdio = options.stdio || 'inherit';

    program.lsaveCursor('spawn');
    // program.csr(0, program.rows - 1);
    program.normalBuffer();
    program.showCursor();
    if (mouse) program.disableMouse();

    const write = program.output.write;
    program.output.write = () => {};
    program.input.pause();
    if (program.input.setRawMode) {
      program.input.setRawMode(false);
    }

    const resume: any = () => {
      if (resume.done) return;
      resume.done = true;

      if (program.input.setRawMode) {
        program.input.setRawMode(true);
      }
      program.input.resume();
      program.output.write = write;

      program.alternateBuffer();
      // program.csr(0, program.rows - 1);
      if (mouse) {
        program.enableMouse();
        if (screen.options.sendFocus) {
          screen.program.setMouse({ sendFocus: true }, true);
        }
      }

      screen.alloc();
      screen.render();

      screen.program.lrestoreCursor('spawn', true);
    };

    ps = spawn(file, args, options);

    ps.on('error', resume);

    ps.on('exit', resume);

    return ps;
  }

  exec(file: string, args: any, options: any, callback: Function) {
    const ps = this.spawn(file, args, options);

    ps.on('error', (err: Error) => {
      if (!callback) return;
      return callback(err, false);
    });

    ps.on('exit', (code: any) => {
      if (!callback) return;
      return callback(null, code === 0);
    });

    return ps;
  }

  readEditor(options: any, callback: Function) {
    if (typeof options === 'string') {
      options = { editor: options };
    }

    if (!callback) {
      callback = options;
      options = null;
    }

    if (!callback) {
      callback = () => {};
    }

    options = options || {};

    const self = this;
    const editor = options.editor || process.env.EDITOR || 'vi';
    const name = options.name || process.title || 'blessed';
    const rnd = Math.random()
      .toString(36)
      .split('.')
      .pop();
    const file = `/tmp/${name}.${rnd}`;
    const args = [file];
    let opt = {
      stdio: 'inherit',
      env: process.env,
      cwd: process.env.HOME,
    };

    function writeFile(callback: (err: NodeJS.ErrnoException | null) => void) {
      if (!options.value) return callback(null);
      return fs.writeFile(file, options.value, callback);
    }

    return writeFile((err: NodeJS.ErrnoException | null) => {
      if (err) return callback(err);
      return self.exec(editor, args, opt, (err: Error, success: boolean) => {
        if (err) return callback(err);
        return fs.readFile(file, 'utf8', (err, data) =>
          fs.unlink(file, () => {
            if (!success) return callback(new Error('Unsuccessful.'));
            if (err) return callback(err);
            return callback(null, data);
          }),
        );
      });
    });
  }

  displayImage(file: any, callback: Function) {
    if (!file) {
      if (!callback) return;
      return callback(new Error('No image.'));
    }

    file = path.resolve(process.cwd(), file);

    if (!~file.indexOf('://')) {
      file = `file://${file}`;
    }

    const args = ['w3m', '-T', 'text/html'];

    const input = `<title>press q to exit</title><img align="center" src="${file}">`;

    const opt = {
      stdio: ['pipe', 1, 2],
      env: process.env,
      cwd: process.env.HOME,
    };

    const ps = this.spawn(args[0], args.slice(1), opt);

    ps.on('error', (err: Error) => {
      if (!callback) return;
      return callback(err);
    });

    ps.on('exit', (code: any) => {
      if (!callback) return;
      if (code !== 0) return callback(new Error(`Exit Code: ${code}`));
      return callback(null, code === 0);
    });

    ps.stdin.write(`${input}\n`);
    ps.stdin.end();
  }

  setEffects(el: any, fel: any, over: any, out: any, effects: any, temp: any) {
    if (!effects) return;

    const tmp = {};
    if (temp) el[temp] = tmp;

    if (typeof el !== 'function') {
      const _el = el;
      el = () => _el;
    }

    fel.on(over, () => {
      const element = el();
      Object.keys(effects).forEach(key => {
        const val = effects[key];
        if (val !== null && typeof val === 'object') {
          // @ts-ignore
          tmp[key] = tmp[key] || {};
          // element.style[key] = element.style[key] || {};
          Object.keys(val).forEach(k => {
            const v = val[k];
            // @ts-ignore
            tmp[key][k] = element.style[key][k];
            element.style[key][k] = v;
          });
          return;
        }
        // @ts-ignore
        tmp[key] = element.style[key];
        element.style[key] = val;
      });
      element.screen.render();
    });

    fel.on(out, () => {
      const element = el();
      Object.keys(effects).forEach(key => {
        const val = effects[key];
        if (val !== null && typeof val === 'object') {
          // @ts-ignore
          tmp[key] = tmp[key] || {};
          // element.style[key] = element.style[key] || {};
          Object.keys(val).forEach(k => {
            // @ts-ignore
            if (tmp[key].hasOwnProperty(k)) {
              // @ts-ignore
              element.style[key][k] = tmp[key][k];
            }
          });
          return;
        }
        if (tmp.hasOwnProperty(key)) {
          // @ts-ignore
          element.style[key] = tmp[key];
        }
      });
      element.screen.render();
    });
  }

  sigtstp(callback: Function) {
    const self = this;
    this.program.sigtstp(() => {
      self.alloc();
      self.render();
      self.program.lrestoreCursor('pause', true);
      if (callback) callback();
    });
  }

  copyToClipboard(text: string) {
    return this.program.copyToClipboard(text);
  }

  cursorShape(shape: any, blink: any) {
    const self = this;

    this.cursor.shape = shape || 'block';
    this.cursor.blink = blink || false;
    this.cursor._set = true;

    if (this.cursor.artificial) {
      if (!this.program.hideCursor_old) {
        const hideCursor = this.program.hideCursor;
        this.program.hideCursor_old = this.program.hideCursor;
        this.program.hideCursor = () => {
          hideCursor.call(self.program);
          self.cursor._hidden = true;
          if (self.renders) self.render();
        };
      }
      if (!this.program.showCursor_old) {
        const showCursor = this.program.showCursor;
        this.program.showCursor_old = this.program.showCursor;
        this.program.showCursor = () => {
          self.cursor._hidden = false;
          if (self.program._exiting) showCursor.call(self.program);
          if (self.renders) self.render();
        };
      }
      if (!this._cursorBlink) {
        this._cursorBlink = setInterval(() => {
          if (!self.cursor.blink) return;
          self.cursor._state ^= 1;
          if (self.renders) self.render();
        }, 500);
        if (this._cursorBlink.unref) {
          this._cursorBlink.unref();
        }
      }
      return true;
    }

    return this.program.cursorShape(this.cursor.shape, this.cursor.blink);
  }

  cursorColor(color: any) {
    this.cursor.color = color != null ? colors.convert(color) : null;
    this.cursor._set = true;

    if (this.cursor.artificial) {
      return true;
    }

    return this.program.cursorColor(colors.ncolors[this.cursor.color]);
  }

  _cursorAttr(cursor: any, dattr: any) {
    let attr = dattr || this.dattr;
    let cattr;
    let ch;

    if (cursor.shape === 'line') {
      attr &= ~(0x1ff << 9);
      attr |= 7 << 9;
      ch = '\u2502';
    } else if (cursor.shape === 'underline') {
      attr &= ~(0x1ff << 9);
      attr |= 7 << 9;
      attr |= 2 << 18;
    } else if (cursor.shape === 'block') {
      attr &= ~(0x1ff << 9);
      attr |= 7 << 9;
      attr |= 8 << 18;
    } else if (typeof cursor.shape === 'object' && cursor.shape) {
      // @ts-ignore
      cattr = Element.prototype.sattr.call(cursor, cursor.shape);

      if (
        cursor.shape.bold ||
        cursor.shape.underline ||
        cursor.shape.blink ||
        cursor.shape.inverse ||
        cursor.shape.invisible
      ) {
        attr &= ~(0x1ff << 18);
        attr |= ((cattr >> 18) & 0x1ff) << 18;
      }

      if (cursor.shape.fg) {
        attr &= ~(0x1ff << 9);
        attr |= ((cattr >> 9) & 0x1ff) << 9;
      }

      if (cursor.shape.bg) {
        attr &= ~(0x1ff << 0);
        attr |= cattr & 0x1ff;
      }

      if (cursor.shape.ch) {
        ch = cursor.shape.ch;
      }
    }

    if (cursor.color != null) {
      attr &= ~(0x1ff << 9);
      attr |= cursor.color << 9;
    }

    return {
      ch,
      attr,
    };
  }

  screenshot(xi: number, xl: number, yi: number, yl: number, term: any) {
    if (xi == null) xi = 0;
    if (xl == null) xl = this.cols;
    if (yi == null) yi = 0;
    if (yl == null) yl = this.rows;

    if (xi < 0) xi = 0;
    if (yi < 0) yi = 0;

    let x;
    let y;
    let line;
    let out;
    let ch;
    let data;
    let attr;

    const sdattr = this.dattr;

    if (term) {
      this.dattr = term.defAttr;
    }

    let main = '';

    for (y = yi; y < yl; y++) {
      line = term ? term.lines[y] : this.lines![y];

      if (!line) break;

      out = '';
      attr = this.dattr;

      for (x = xi; x < xl; x++) {
        if (!line[x]) break;

        data = line[x][0];
        ch = line[x][1];

        if (data !== attr) {
          if (attr !== this.dattr) {
            out += '\x1b[m';
          }
          if (data !== this.dattr) {
            let _data = data;
            if (term) {
              if (((_data >> 9) & 0x1ff) === 257) _data |= 0x1ff << 9;
              if ((_data & 0x1ff) === 256) _data |= 0x1ff;
            }
            out += this.codeAttr(_data);
          }
        }

        if (this.fullUnicode) {
          if (unicode.charWidth(line[x][1]) === 2) {
            if (x === xl - 1) {
              ch = ' ';
            } else {
              x++;
            }
          }
        }

        out += ch;
        attr = data;
      }

      if (attr !== this.dattr) {
        out += '\x1b[m';
      }

      if (out) {
        main += (y > 0 ? '\n' : '') + out;
      }
    }

    main = `${main.replace(/(?:\s*\x1b\[40m\s*\x1b\[m\s*)*$/, '')}\n`;

    if (term) {
      this.dattr = sdattr;
    }

    return main;
  }

  /**
   * Positioning
   */

  _getPos() {
    return this;
  }
}

/**
 * Angle Table
 */

const angles = {
  '\u2518': true, // '┘'
  '\u2510': true, // '┐'
  '\u250c': true, // '┌'
  '\u2514': true, // '└'
  '\u253c': true, // '┼'
  '\u251c': true, // '├'
  '\u2524': true, // '┤'
  '\u2534': true, // '┴'
  '\u252c': true, // '┬'
  '\u2502': true, // '│'
  '\u2500': true, // '─'
};

const langles = {
  '\u250c': true, // '┌'
  '\u2514': true, // '└'
  '\u253c': true, // '┼'
  '\u251c': true, // '├'
  '\u2534': true, // '┴'
  '\u252c': true, // '┬'
  '\u2500': true, // '─'
};

const uangles = {
  '\u2510': true, // '┐'
  '\u250c': true, // '┌'
  '\u253c': true, // '┼'
  '\u251c': true, // '├'
  '\u2524': true, // '┤'
  '\u252c': true, // '┬'
  '\u2502': true, // '│'
};

const rangles = {
  '\u2518': true, // '┘'
  '\u2510': true, // '┐'
  '\u253c': true, // '┼'
  '\u2524': true, // '┤'
  '\u2534': true, // '┴'
  '\u252c': true, // '┬'
  '\u2500': true, // '─'
};

const dangles = {
  '\u2518': true, // '┘'
  '\u2514': true, // '└'
  '\u253c': true, // '┼'
  '\u251c': true, // '├'
  '\u2524': true, // '┤'
  '\u2534': true, // '┴'
  '\u2502': true, // '│'
};

// var cdangles = {
//   '\u250c': true  // '┌'
// };

// Every ACS angle character can be
// represented by 4 bits ordered like this:
// [langle][uangle][rangle][dangle]
const angleTable = {
  '0000': '', // ?
  '0001': '\u2502', // '│' // ?
  '0010': '\u2500', // '─' // ??
  '0011': '\u250c', // '┌'
  '0100': '\u2502', // '│' // ?
  '0101': '\u2502', // '│'
  '0110': '\u2514', // '└'
  '0111': '\u251c', // '├'
  '1000': '\u2500', // '─' // ??
  '1001': '\u2510', // '┐'
  '1010': '\u2500', // '─' // ??
  '1011': '\u252c', // '┬'
  '1100': '\u2518', // '┘'
  '1101': '\u2524', // '┤'
  '1110': '\u2534', // '┴'
  '1111': '\u253c', // '┼'
};

Object.keys(angleTable).forEach(key => {
  // @ts-ignore
  angleTable[parseInt(key, 2)] = angleTable[key];
  // @ts-ignore
  delete angleTable[key];
});

export default Screen;
