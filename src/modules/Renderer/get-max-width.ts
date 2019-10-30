import Yoga from '../Yoga';

export default (yogaNode: Yoga.YogaNode) => {
  return (
    yogaNode.getComputedWidth() -
    yogaNode.getComputedBorder(Yoga.EDGE_HORIZONTAL) * 2 -
    yogaNode.getComputedPadding(Yoga.EDGE_HORIZONTAL) * 2
  );
};
