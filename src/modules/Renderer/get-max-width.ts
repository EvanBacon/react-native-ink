import Yoga from '../Yoga';

export default (yogaNode: Yoga.YogaNode) => {
  return (
    yogaNode.getComputedWidth() -
    yogaNode.getComputedPadding(Yoga.EDGE_HORIZONTAL) * 2
  );
};
