import { YogaNode, EDGE_HORIZONTAL } from 'yoga-layout-prebuilt';

export default (yogaNode: YogaNode) => {
  return (
    yogaNode.getComputedWidth() -
    yogaNode.getComputedPadding(EDGE_HORIZONTAL) * 2
  );
};
