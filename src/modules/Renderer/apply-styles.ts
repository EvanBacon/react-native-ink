import Yoga from '../Yoga';

const applyPositionStyles = (node: Yoga.YogaNode, style: any) => {
  if (!style.position) {
    // @ts-ignore
    node.setPositionType(NaN);
  }

  if (style.position === 'absolute') {
    node.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE);
  }
};

const applyMarginStyles = (node: Yoga.YogaNode, style: any) => {
  node.setMargin(
    Yoga.EDGE_START,
    style.marginLeft || style.marginX || style.margin || 0,
  );
  node.setMargin(
    Yoga.EDGE_END,
    style.marginRight || style.marginX || style.margin || 0,
  );
  node.setMargin(
    Yoga.EDGE_TOP,
    style.marginTop || style.marginY || style.margin || 0,
  );
  node.setMargin(
    Yoga.EDGE_BOTTOM,
    style.marginBottom || style.marginY || style.margin || 0,
  );
};

const applyBorderStyles = (node: Yoga.YogaNode, style: any) => {
  node.setBorder(
    Yoga.EDGE_START,
    style.borderLeft || style.borderX || style.border || 0,
  );
  node.setBorder(
    Yoga.EDGE_END,
    style.borderRight || style.borderX || style.border || 0,
  );
  node.setBorder(
    Yoga.EDGE_TOP,
    style.borderTop || style.borderY || style.border || 0,
  );
  node.setBorder(
    Yoga.EDGE_BOTTOM,
    style.borderBottom || style.borderY || style.border || 0,
  );
};

const applyPaddingStyles = (node: Yoga.YogaNode, style: any) => {
  node.setPadding(
    Yoga.EDGE_LEFT,
    style.paddingLeft || style.paddingX || style.padding || 0,
  );
  node.setPadding(
    Yoga.EDGE_RIGHT,
    style.paddingRight || style.paddingX || style.padding || 0,
  );
  node.setPadding(
    Yoga.EDGE_TOP,
    style.paddingTop || style.paddingY || style.padding || 0,
  );
  node.setPadding(
    Yoga.EDGE_BOTTOM,
    style.paddingBottom || style.paddingY || style.padding || 0,
  );
};

const applyFlexStyles = (node: Yoga.YogaNode, style: any) => {
  node.setFlexGrow(style.flexGrow || 0);
  node.setFlexShrink(
    typeof style.flexShrink === 'number' ? style.flexShrink : 1,
  );

  if (style.flexDirection === 'row') {
    node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
  }

  if (style.flexDirection === 'row-reverse') {
    node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW_REVERSE);
  }

  if (style.flexDirection === 'column') {
    node.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN);
  }

  if (style.flexDirection === 'column-reverse') {
    node.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN_REVERSE);
  }

  if (typeof style.flexBasis === 'number') {
    node.setFlexBasis(style.flexBasis);
  } else if (typeof style.flexBasis === 'string') {
    node.setFlexBasisPercent(parseInt(style.flexBasis, 10));
  } else {
    // This should be replaced with node.setFlexBasisAuto() when new Yoga release is out
    node.setFlexBasis(NaN);
  }

  if (style.alignItems === 'stretch' || !style.alignItems) {
    node.setAlignItems(Yoga.ALIGN_STRETCH);
  }

  if (style.alignItems === 'flex-start') {
    node.setAlignItems(Yoga.ALIGN_FLEX_START);
  }

  if (style.alignItems === 'center') {
    node.setAlignItems(Yoga.ALIGN_CENTER);
  }

  if (style.alignItems === 'flex-end') {
    node.setAlignItems(Yoga.ALIGN_FLEX_END);
  }

  if (style.justifyContent === 'flex-start' || !style.justifyContent) {
    node.setJustifyContent(Yoga.JUSTIFY_FLEX_START);
  }

  if (style.justifyContent === 'center') {
    node.setJustifyContent(Yoga.JUSTIFY_CENTER);
  }

  if (style.justifyContent === 'flex-end') {
    node.setJustifyContent(Yoga.JUSTIFY_FLEX_END);
  }

  if (style.justifyContent === 'space-between') {
    node.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN);
  }

  if (style.justifyContent === 'space-around') {
    node.setJustifyContent(Yoga.JUSTIFY_SPACE_AROUND);
  }
};

const applyDimensionStyles = (node: Yoga.YogaNode, style: any) => {
  if (typeof style.width === 'number') {
    node.setWidth(style.width);
  } else if (typeof style.width === 'string') {
    node.setWidthPercent(parseInt(style.width, 10));
  } else {
    node.setWidthAuto();
  }

  if (typeof style.height === 'number') {
    node.setHeight(style.height);
  } else if (typeof style.height === 'string') {
    node.setHeightPercent(parseInt(style.height, 10));
  } else {
    node.setHeightAuto();
  }

  if (typeof style.minWidth === 'string') {
    node.setMinWidthPercent(parseInt(style.minWidth, 10));
  } else {
    node.setMinWidth(style.minWidth || 0);
  }

  if (typeof style.minHeight === 'string') {
    node.setMinHeightPercent(parseInt(style.minHeight, 10));
  } else {
    node.setMinHeight(style.minHeight || 0);
  }
};

export default (node: Yoga.YogaNode, style = {}) => {
  applyPositionStyles(node, style);
  applyMarginStyles(node, style);
  applyPaddingStyles(node, style);
  applyBorderStyles(node, style);
  applyFlexStyles(node, style);
  applyDimensionStyles(node, style);
};
