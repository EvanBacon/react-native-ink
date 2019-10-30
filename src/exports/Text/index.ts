/**
 * Copyright (c) Nicolas Gallagher.
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// @ts-ignore
import ansiAlign from 'ansi-align';
import chalk from 'chalk';
import cliBoxes from 'cli-boxes';
// @ts-ignore
import warning from 'fbjs/lib/warning';
import { bool } from 'prop-types';
import React, { Component } from 'react';
import stringWidth from 'string-width';
import termSize from 'term-size';
import widestLine from 'widest-line';

import normalizeColor from '../../modules/normalizeColor';
import StyleSheetflattenStyle from '../StyleSheet/flattenStyle';

// @ts-ignore
// import createElement from '../../components/createElement';
// @ts-ignore
// import applyLayout from '../../modules/applyLayout';
// import applyNativeMethods from '../../modules/applyNativeMethods';
// import arrify from 'arrify';

// import css from '../StyleSheet/css';

// @ts-ignore
// import { StyleSheet } from 'react-native-web';

// import StyleSheet from '../StyleSheet';
// import TextPropTypes from './TextPropTypes';
function asArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return asArray([value]);
}

const NL = '\n';
const PAD = ' ';

function paddingFromStyle(
  style: any,
): { top: number; left: number; bottom: number; right: number } {
  return {
    top: style.paddingTop || style.paddingVertical || style.padding || 0,
    bottom: style.paddingBottom || style.paddingVertical || style.padding || 0,
    left: style.paddingLeft || style.paddingHorizontal || style.padding || 0,
    right: style.paddingRight || style.paddingHorizontal || style.padding || 0,
  };
}

function marginFromStyle(
  style: any,
): { top: number; left: number; bottom: number; right: number } {
  return {
    top: style.marginTop || style.marginVertical || style.margin || 0,
    bottom: style.marginBottom || style.marginVertical || style.margin || 0,
    left: style.marginLeft || style.marginHorizontal || style.margin || 0,
    right: style.marginRight || style.marginHorizontal || style.margin || 0,
  };
}

const getBorderChars = (
  borderStyle: string | { [key: string]: string },
): { [key: string]: string } => {
  const sides = [
    'topLeft',
    'topRight',
    'bottomRight',
    'bottomLeft',
    'vertical',
    'horizontal',
  ];

  let chararacters: { [key: string]: string } = {};

  if (typeof borderStyle === 'string') {
    // @ts-ignore
    chararacters = cliBoxes[borderStyle];

    if (!chararacters) {
      throw new TypeError(`Invalid border style: ${borderStyle}`);
    }
  } else {
    for (const side of sides) {
      if (!borderStyle[side] || typeof borderStyle[side] !== 'string') {
        throw new TypeError(`Invalid border style: ${side}`);
      }
    }

    chararacters = borderStyle;
  }

  return chararacters;
};

const colorizeText = (text: any, style: any): string => {
  // TODO: Bacon: use alpha for dim
  // return options.dimBorder ? chalk.dim(newBorder) : newBorder;
  if (style.color) {
    const color = normalizeColor(style.color);
    if (color) {
      // @ts-ignore
      return chalk.rgb(...color)(text);
    }
  }
  return text;
};

function resolveColor(style: any, stylePropKey: string): number[] | null {
  if (stylePropKey in style) {
    return normalizeColor(style[stylePropKey]) || null;
  }
  return null;
}

const BORDER_COLOR_STYLES = [
  'borderTopColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderRightColor',
];
function borderColorFromStyle(
  style: any,
): {
  top: number[] | undefined;
  left: number[] | undefined;
  bottom: number[] | undefined;
  right: number[] | undefined;
} {
  const resolvedStyle: any = {};

  for (const styleProp of BORDER_COLOR_STYLES) {
    const color = resolveColor(style, styleProp);
    if (color) resolvedStyle[styleProp] = color;
  }

  if (Object.keys(resolvedStyle).length !== BORDER_COLOR_STYLES.length) {
    const styleProp = 'borderColor';
    const color = resolveColor(style, styleProp);
    if (color) resolvedStyle[styleProp] = color;
  }

  return {
    top: resolvedStyle.borderTopColor || resolvedStyle.borderColor,
    bottom: resolvedStyle.borderBottomColor || resolvedStyle.borderColor,
    left: resolvedStyle.borderLeftColor || resolvedStyle.borderColor,
    right: resolvedStyle.borderRightColor || resolvedStyle.borderColor,
  };
}

function resolveBorderStyle(style: any): string {
  if ('borderStyle' in style) {
    return style.borderStyle;
  }

  if ('borderWidth' in style && style.borderWidth > 0) {
    if (style.borderWidth <= 0.5) {
      return 'single';
    } else {
      return 'bold';
    }
  } else if ('borderRadius' in style && style.borderRadius > 0) {
    return 'round';
  }
  return 'single';
}

const BORDER_WIDTH_STYLES = [
  'borderTopWidth',
  'borderLeftWidth',
  'borderBottomWidth',
  'borderRightWidth',
];
function styleHasBorders(style: any): boolean {
  for (const styleProp of [
    ...BORDER_WIDTH_STYLES,
    'borderWidth',
    ...BORDER_COLOR_STYLES,
    'borderColor',
    'borderStyle',
  ]) {
    if (styleProp in style) {
      return true;
    }
  }
  return false;
}

function withStyle({ children, style }: any): string {
  const flattenStyle = StyleSheetflattenStyle(style) || {};
  const textAlign = flattenStyle.textAlign || 'left';
  const alignSelf = flattenStyle.alignSelf || 'flex-start';
  const hasBorders = styleHasBorders(flattenStyle);
  const borderColors = hasBorders && borderColorFromStyle(style);

  const backgroundColor = flattenStyle.backgroundColor
    ? normalizeColor(flattenStyle.backgroundColor)
    : null;
  const borderStyle = hasBorders && resolveBorderStyle(flattenStyle);
  children = ansiAlign(children, { align: textAlign });
  children = colorizeText(children, flattenStyle);

  if (asArray(flattenStyle.fontWeight).includes('bold')) {
    children = chalk.bold(children);
  }

  if (['italic', 'oblique'].includes(flattenStyle.fontStyle)) {
    children = chalk.italic(children);
  }

  const _textDecorationStyle = asArray(flattenStyle.textDecorationStyle);
  if (_textDecorationStyle.includes('underline')) {
    children = chalk.underline(children);
  }
  if (_textDecorationStyle.includes('line-through')) {
    children = chalk.strikethrough(children);
  }

  let lines = children.split(NL);
  const chars = getBorderChars(borderStyle || 'single');

  const padding = paddingFromStyle(flattenStyle);
  const margin = marginFromStyle(flattenStyle);
  if (padding.top > 0) {
    lines = new Array(padding.top).fill('').concat(lines);
  }

  if (padding.bottom > 0) {
    lines = lines.concat(new Array(padding.bottom).fill(''));
  }

  const colorizeBackground = (content: any, style: any): string => {
    // TODO: Bacon: use alpha for dim
    // return options.dimBorder ? chalk.dim(newBorder) : newBorder;
    if (backgroundColor) {
      // @ts-ignore
      return chalk.bgRgb(...backgroundColor)(content);
    }
    return content;
  };

  const colorizeBorder = (border: any, side: string): string => {
    // TODO: Bacon: use alpha for dim
    // return options.dimBorder ? chalk.dim(newBorder) : newBorder;
    // @ts-ignore
    if (borderColors[side]) {
      // @ts-ignore
      border = chalk.rgb(...borderColors[side])(border);
    }
    // if (backgroundColor) {
    //   // @ts-ignore
    //   border = chalk.bgRgb(...backgroundColor)(border);
    // }
    return border;
  };

  const contentWidth = widestLine(children) + padding.left + padding.right;
  const paddingLeft = PAD.repeat(padding.left);
  const { columns } = termSize();
  let marginLeft = PAD.repeat(margin.left);

  if (alignSelf === 'center') {
    const padWidth = Math.max((columns - contentWidth) / 2, 0);
    marginLeft = PAD.repeat(padWidth);
  } else if (alignSelf === 'flex-end') {
    const padWidth = Math.max(columns - contentWidth - margin.right - 2, 0);
    marginLeft = PAD.repeat(padWidth);
  }

  const horizontal = chars.horizontal.repeat(contentWidth);
  const top = hasBorders
    ? colorizeBorder(
        NL.repeat(margin.top) +
          marginLeft +
          chars.topLeft +
          horizontal +
          chars.topRight,
        'top',
      )
    : marginLeft;
  const bottom = hasBorders
    ? colorizeBorder(
        marginLeft +
          chars.bottomLeft +
          horizontal +
          chars.bottomRight +
          NL.repeat(margin.bottom),
        'bottom',
      )
    : marginLeft;
  const leftSide = hasBorders ? colorizeBorder(chars.vertical, 'left') : '';
  const rightSide = hasBorders ? colorizeBorder(chars.vertical, 'right') : '';

  const middle = lines
    .map((line: string): string => {
      const paddingRight = PAD.repeat(
        contentWidth - stringWidth(line) - padding.left,
      );
      return (
        marginLeft +
        leftSide +
        colorizeBackground(paddingLeft + line + paddingRight, flattenStyle) +
        rightSide
      );
    })
    .join(NL);

  return top + NL + middle + NL + bottom;
}

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

    const transformChildren = (children: string) => {
      // console.log('BACONCONC', props);
      const {
        // children,
        unstable__transformChildren,
        style = {} as any,
      } = this.props as {
        [key: string]: any;
        style: any;
      };
      // const _backgroundColor = normalizeColor(backgroundColor);
      // console.log(
      //   'Text.backgroundColor',
      //   backgroundColor,
      //   '>>>',
      //   _backgroundColor,
      // );
      // if (_backgroundColor) {
      //   // @ts-ignore
      //   children = chalk.bgRgb(..._backgroundColor)(children);
      // }

      children = withStyle({ children, style });

      if (unstable__transformChildren) {
        children = unstable__transformChildren(children);
      }

      return children;
    };

    // const children = transformChildren(this.props as any);
    // return createElement(component, {
    return React.createElement(component, {
      ...otherProps,
      unstable__transformChildren: transformChildren,
      style: { flexDirection: 'row' },
      // children,
    });
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
