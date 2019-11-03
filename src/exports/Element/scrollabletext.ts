/**
 * scrollabletext.js - scrollable text element for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */
import ScrollableBox from './scrollablebox';

export default class ScrollableText extends ScrollableBox {
  type = 'scrollable-text';

  constructor({ alwaysScroll = true, ...options } = {}) {
    super({ alwaysScroll, ...options });
  }
}
