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
import createElement from '../createElement';
// import css from '../StyleSheet/css';
// import filterSupportedProps from './filterSupportedProps';

// @ts-ignore
import invariant from 'fbjs/lib/invariant';
// @ts-ignore
import warning from 'fbjs/lib/warning';
// import StyleSheet from '../StyleSheet';
// import ViewPropTypes, { ViewProps } from './ViewPropTypes';
import React, { Component } from 'react';

// const calculateHitSlopStyle = (hitSlop: any): any => {
//   const hitStyle: any = {};
//   for (const prop in hitSlop) {
//     if (hitSlop.hasOwnProperty(prop)) {
//       const value = hitSlop[prop];
//       hitStyle[prop] = value > 0 ? -1 * value : 0;
//     }
//   }
//   return hitStyle;
// };

class View extends Component<any> {
  static displayName = 'View';

  static contextTypes = {
    isInAParentText: bool,
  };

  // static propTypes = ViewPropTypes;

  render() {
    const hitSlop = this.props.hitSlop;
    const supportedProps = this.props; // filterSupportedProps(this.props);

    if (process.env.NODE_ENV !== 'production') {
      warning(
        this.props.className == null,
        'Using the "className" prop on <View> is deprecated.',
      );

      React.Children.toArray(this.props.children).forEach(item => {
        invariant(
          typeof item !== 'string',
          `Unexpected text node: ${item}. A text node cannot be a child of a <View>.`,
        );
      });
    }

    // const { isInAParentText } = this.context;

    // @ts-ignore
    // supportedProps.classList = [this.props.className, classes.view];
    // supportedProps.style = StyleSheet.compose(
    //   isInAParentText && styles.inline,
    //   this.props.style
    // );

    if (hitSlop) {
      // const hitSlopStyle = calculateHitSlopStyle(hitSlop);
      // const hitSlopChild = createElement('span', {
      //   classList: [classes.hitSlop],
      //   style: hitSlopStyle,
      // });
      // @ts-ignore
      // supportedProps.children = React.Children.toArray([
      //   hitSlopChild,
      //   supportedProps.children,
      // ]);
    }

    return createElement('div', supportedProps);
  }
}

// const classes = {
//   //css.create({
//   view: {
//     alignItems: 'stretch',
//     border: '0 solid black',
//     boxSizing: 'border-box',
//     display: 'flex',
//     flexBasis: 'auto',
//     flexDirection: 'column',
//     flexShrink: 0,
//     margin: 0,
//     minHeight: 0,
//     minWidth: 0,
//     padding: 0,
//     position: 'relative',
//     zIndex: 0,
//   },
//   // this zIndex-ordering positions the hitSlop above the View but behind
//   // its children
//   hitSlop: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     zIndex: -1,
//   },
// }; //);

// const styles = StyleSheet.create({
//   inline: {
//     display: 'inline-flex'
//   }
// });

export default View;
