/**
 * node.js - base abstract node for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import { EventEmitter } from './events';
import Screen from './screen';

/**
 * Node
 */

type Options = { [key: string]: any };

interface Element {
  [key: string]: any;
  children: Element[];
}

export default class Node extends EventEmitter {
  options: Options;
  screen: Screen | undefined;
  children: Element[];
  $: any;
  _: any;
  index: any;
  static uid = 0;
  uid = 0;
  type = 'node';

  constructor(options: any = {}) {
    // if (!(this instanceof Node)) return new Node(options);
    super();
    const self = this;

    this.options = options;

    this.screen = this.screen || options.screen;

    if (!this.screen) {
      if (this.type === 'screen') {
        // @ts-ignore
        this.screen = this;
      } else if (Screen.total === 1) {
        // @ts-ignore
        this.screen = Screen.global;
      } else if (options.parent) {
        this.screen = options.parent;
        while (this.screen && this.screen.type !== 'screen') {
          this.screen = this.screen.parent;
        }
      } else if (Screen.total) {
        // This _should_ work in most cases as long as the element is appended
        // synchronously after the screen's creation. Throw error if not.
        this.screen = Screen.instances[Screen.instances.length - 1];
        process.nextTick(function() {
          if (!self.parent) {
            throw new Error(
              'Element (' +
                self.type +
                ')' +
                ' was not appended synchronously after the' +
                " screen's creation. Please set a `parent`" +
                " or `screen` option in the element's constructor" +
                ' if you are going to use multiple screens and' +
                ' append the element later.',
            );
          }
        });
      } else {
        throw new Error('No active screen.');
      }
    }

    this.parent = options.parent || null;
    this.children = [];
    // @ts-ignore
    this.$ = this._ = this.data = {};
    this.uid = Node.uid++;
    this.index = this.index != null ? this.index : -1;

    if (this.type !== 'screen') {
      this.detached = true;
    }

    if (this.parent) {
      this.parent.append(this);
    }

    (options.children || []).forEach(this.append.bind(this));
  }

  detached: boolean = false;

  insert(element: any, i: number) {
    var self = this;

    if (element.screen && element.screen !== this.screen) {
      throw new Error("Cannot switch a node's screen.");
    }

    element.detach();
    element.parent = this;
    element.screen = this.screen;

    if (i === 0) {
      this.children.unshift(element);
    } else if (i === this.children.length) {
      this.children.push(element);
    } else {
      this.children.splice(i, 0, element);
    }

    element.emit('reparent', this);
    this.emit('adopt', element);

    (function emit(el) {
      var n = el.detached !== self.detached;
      el.detached = self.detached;
      if (n) el.emit('attach');
      el.children.forEach(emit);
    })(element);

    // @ts-ignore
    if (!this.screen.focused) {
      // @ts-ignore
      this.screen.focused = element;
    }
  }

  prepend(element: any) {
    this.insert(element, 0);
  }

  append(element: any) {
    this.insert(element, this.children.length);
  }

  insertBefore(element: any, other: any) {
    var i = this.children.indexOf(other);
    if (~i) this.insert(element, i);
  }

  insertAfter(element: any, other: any) {
    var i = this.children.indexOf(other);
    if (~i) this.insert(element, i + 1);
  }

  remove(element: any) {
    if (element.parent !== this) return;

    var i = this.children.indexOf(element);
    if (!~i) return;

    element.clearPos();

    element.parent = null;

    this.children.splice(i, 1);

    // @ts-ignore
    i = this.screen.clickable.indexOf(element);
    // @ts-ignore
    if (~i) this.screen.clickable.splice(i, 1);
    // @ts-ignore
    i = this.screen.keyable.indexOf(element);
    // @ts-ignore
    if (~i) this.screen.keyable.splice(i, 1);

    element.emit('reparent', null);
    this.emit('remove', element);

    (function emit(el) {
      var n = el.detached !== true;
      el.detached = true;
      if (n) el.emit('detach');
      el.children.forEach(emit);
    })(element);

    // @ts-ignore
    if (this.screen.focused === element) {
      // @ts-ignore
      this.screen.rewindFocus();
    }
  }

  detach() {
    if (this.parent) this.parent.remove(this);
  }

  free() {
    return;
  }

  destroy() {
    this.detach();
    this.forDescendants(function(el: any) {
      el.free();
      el.destroyed = true;
      el.emit('destroy');
    }, this);
  }

  forDescendants(iter: Function, s: any) {
    if (s) iter(this);
    this.children.forEach(function emit(el) {
      iter(el);
      el.children.forEach(emit);
    });
  }

  // @ts-ignore
  forAncestors(iter, s) {
    var el = this;
    if (s) iter(this);
    while ((el = el.parent)) {
      iter(el);
    }
  }

  // @ts-ignore
  collectDescendants(s) {
    // @ts-ignore
    var out: any[] = [];
    // @ts-ignore
    this.forDescendants(el => {
      out.push(el);
    }, s);
    // @ts-ignore
    return out;
  }

  collectAncestors(s: any): any {
    var out: any = [];
    this.forAncestors((el: any) => out.push(el), s);
    return out;
  }

  emitDescendants(..._args: any[]) {
    var args = [..._args];
    let iter: any;

    if (typeof args[args.length - 1] === 'function') {
      iter = args.pop();
    }

    return this.forDescendants(function(el: any) {
      if (iter) iter(el);
      el.emit.apply(el, args);
    }, true);
  }

  emitAncestors(..._args: any[]) {
    var args = [..._args];
    let iter: any;

    if (typeof args[args.length - 1] === 'function') {
      iter = args.pop();
    }

    return this.forAncestors(function(el: any) {
      if (iter) iter(el);
      el.emit.apply(el, args);
    }, true);
  }

  hasDescendant(target: any) {
    return (function find(el: any) {
      for (var i = 0; i < el.children.length; i++) {
        if (el.children[i] === target) {
          return true;
        }
        if (find(el.children[i]) === true) {
          return true;
        }
      }
      return false;
    })(this);
  }

  hasAncestor(target: any) {
    var el = this;
    while ((el = el.parent)) {
      if (el === target) return true;
    }
    return false;
  }

  data: any;

  get(name: string, value: any): any {
    if (this.data.hasOwnProperty(name)) {
      return this.data[name];
    }
    return value;
  }

  set(name: string, value: any): any {
    return (this.data[name] = value);
  }
}
