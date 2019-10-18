/**
 * Copyright (c) Nicolas Gallagher.
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import createStrictShapeTypeChecker from '../createStrictShapeTypeChecker';
import StyleSheet from '../../exports/StyleSheet';
type ReactPropsCheckType = any;

function StyleSheetPropType(shape: {
  [key: string]: ReactPropsCheckType;
}): ReactPropsCheckType {
  const shapePropType = createStrictShapeTypeChecker(shape);
  return function(
    props: any,
    propName: string,
    componentName: string,
    location?: any,
    ...rest: any[]
  ) {
    let newProps = props;
    if (props[propName]) {
      // Just make a dummy prop object with only the flattened style
      newProps = {};
      const flatStyle = StyleSheet.flatten(props[propName]);
      // Remove custom properties from check
      const nextStyle = Object.keys(flatStyle).reduce(
        (acc, curr) => {
          if (curr.indexOf('--') !== 0) {
            acc[curr] = flatStyle[curr];
          }
          return acc;
        },
        {} as any,
      );
      newProps[propName] = nextStyle;
    }
    return shapePropType(newProps, propName, componentName, location, ...rest);
  };
}

export default StyleSheetPropType;
