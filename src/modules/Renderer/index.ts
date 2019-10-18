import Yoga from '../Yoga';

import calculateWrappedText from './calculate-wrapped-text';
import { CLIElement, setStyle } from './DOM';
import Output from './output';
import renderNodeToOutput from './render-node-to-output';

// Since <Static> components can be placed anywhere in the tree, this helper finds and returns them
const findStaticNode = (node: CLIElement): CLIElement | undefined => {
  if (node.unstable__static) {
    return node;
  }

  for (const childNode of node.childNodes) {
    if (childNode.unstable__static) {
      return childNode;
    }

    if (
      Array.isArray(childNode.childNodes) &&
      childNode.childNodes.length > 0
    ) {
      return findStaticNode(childNode);
    }
  }
};

export default ({ terminalWidth = 100 }) => {
  return (node: CLIElement) => {
    setStyle(node, {
      width: terminalWidth,
    });

    node.yogaNode.calculateLayout(undefined, undefined, Yoga.DIRECTION_LTR);
    calculateWrappedText(node);
    node.yogaNode.calculateLayout(undefined, undefined, Yoga.DIRECTION_LTR);

    const output = new Output(
      node.yogaNode.getComputedWidth(),
      node.yogaNode.getComputedHeight(),
    );

    renderNodeToOutput(node, output, { skipStaticElements: true });

    const staticNode = findStaticNode(node);
    let staticOutput;

    if (staticNode) {
      staticOutput = new Output(
        staticNode.yogaNode.getComputedWidth(),
        staticNode.yogaNode.getComputedHeight(),
      );

      renderNodeToOutput(staticNode, staticOutput, {
        skipStaticElements: false,
      });
    }

    const { output: generatedOutput, height: outputHeight } = output.get();

    return {
      output: generatedOutput,
      outputHeight,
      // Newline at the end is needed, because static output doesn't have one, so
      // interactive output will override last line of static output
      staticOutput: staticOutput ? `${staticOutput.get().output}\n` : undefined,
    };
  };
};
