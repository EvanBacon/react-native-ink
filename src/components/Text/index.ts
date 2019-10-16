/**
 * Copyright (c) Nicolas Gallagher.
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// import applyLayout from '../../modules/applyLayout';
// import applyNativeMethods from '../../modules/applyNativeMethods';
import { bool } from 'prop-types';
import { Component } from 'react';
import createElement from '../createElement';
// import arrify from 'arrify';

import normalizeColor from '../../modules/normalizeColor';

// import css from '../StyleSheet/css';

// @ts-ignore
import warning from 'fbjs/lib/warning';
// import StyleSheet from '../StyleSheet';
// import TextPropTypes from './TextPropTypes';
import chalk from 'chalk';

function asArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return asArray([value]);
}

const transformChildren = ({
  children,
  unstable__transformChildren,
  style: {
    color,
    backgroundColor,
    fontWeight,
    textDecorationStyle,
    textDecorationLine,
    textDecorationColor,
    fontStyle,
  } = {},
}: {
  [key: string]: any;
  style: any;
}) => {
  const _color = normalizeColor(color);
  console.log('Text.color', color, '>>>', _color);
  if (_color) {
    // @ts-ignore
    children = chalk.rgb(..._color)(children);
  }
  const _backgroundColor = normalizeColor(backgroundColor);
  console.log('Text.backgroundColor', backgroundColor, '>>>', _backgroundColor);
  if (_backgroundColor) {
    // @ts-ignore
    children = chalk.bgRgb(..._backgroundColor)(children);
  }

  if (asArray(fontWeight).includes('bold')) {
    children = chalk.bold(children);
  }

  if (['italic', 'oblique'].includes(fontStyle)) {
    children = chalk.italic(children);
  }

  const _textDecorationStyle = asArray(textDecorationStyle);
  if (_textDecorationStyle.includes('underline')) {
    children = chalk.underline(children);
  }
  if (_textDecorationStyle.includes('line-through')) {
    children = chalk.strikethrough(children);
  }

  if (unstable__transformChildren) {
    children = unstable__transformChildren(children);
  }

  return children;
};

class Text extends Component<any> {
  static displayName = 'Text';

  //   static propTypes = TextPropTypes;

  static childContextTypes = {
    isInAParentText: bool,
  };

  static contextTypes = {
    isInAParentText: bool,
  };

  getChildContext() {
    return { isInAParentText: true };
  }

  render() {
    const {
      dir,
      numberOfLines,
      onPress,
      selectable,
      style,
      /* eslint-disable */
      adjustsFontSizeToFit,
      allowFontScaling,
      ellipsizeMode,
      lineBreakMode,
      maxFontSizeMultiplier,
      minimumFontScale,
      onLayout,
      onLongPress,
      pressRetentionOffset,
      selectionColor,
      suppressHighlighting,
      textBreakStrategy,
      tvParallaxProperties,
      /* eslint-enable */
      ...otherProps
    } = this.props;

    const { isInAParentText } = this.context;

    if (process.env.NODE_ENV !== 'production') {
      warning(
        this.props.className == null,
        'Using the "className" prop on <Text> is deprecated.',
      );
    }

    const component = isInAParentText ? 'span' : 'div';

    const children = transformChildren(this.props as any);
    return createElement(component, { ...otherProps, children });
  }

  _createEnterHandler(fn: any) {
    return (e: any) => {
      if (e.keyCode === 13) {
        fn && fn(e);
      }
    };
  }

  _createPressHandler(fn: any) {
    return (e: any) => {
      e.stopPropagation();
      fn && fn(e);
    };
  }
}

// const classes = css.create({
//   text: {
//     border: '0 solid black',
//     boxSizing: 'border-box',
//     color: 'black',
//     display: 'inline',
//     font: '14px System',
//     margin: 0,
//     padding: 0,
//     whiteSpace: 'pre-wrap',
//     wordWrap: 'break-word'
//   },
//   textHasAncestor: {
//     color: 'inherit',
//     font: 'inherit',
//     whiteSpace: 'inherit'
//   },
//   textOneLine: {
//     maxWidth: '100%',
//     overflow: 'hidden',
//     textOverflow: 'ellipsis',
//     whiteSpace: 'nowrap'
//   },
//   // See #13
//   textMultiLine: {
//     display: '-webkit-box',
//     maxWidth: '100%',
//     overflow: 'hidden',
//     textOverflow: 'ellipsis',
//     WebkitBoxOrient: 'vertical'
//   }
// });

// const styles = StyleSheet.create({
//   notSelectable: {
//     userSelect: 'none'
//   },
//   pressable: {
//     cursor: 'pointer'
//   }
// });

export default Text;
// export default applyLayout(applyNativeMethods(Text));
