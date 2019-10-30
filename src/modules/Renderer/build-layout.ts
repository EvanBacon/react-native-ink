import Yoga from '../Yoga';
import applyStyles from './apply-styles';
import measureText from './measure-text';
import { CLIElement } from './DOM';

// Traverse the node tree, create Yoga nodes and assign styles to each Yoga node
const buildLayout = (node: CLIElement, options: any): CLIElement => {
  const { config, terminalWidth, skipStaticElements } = options;
  // @ts-ignore: maybe a custom create from prebuilt
  const yogaNode = Yoga.Node.create(config);
  node.yogaNode = yogaNode;

  const style = node.style || {};

  // Root node of the tree
  if (node.nodeName === 'ROOT') {
    // `terminalWidth` can be `undefined` if env isn't a TTY
    yogaNode.setWidth(terminalWidth || 100);

    if (node.childNodes.length > 0) {
      const childNodes = node.childNodes.filter(childNode => {
        return skipStaticElements ? !childNode.unstable__static : true;
      });

      for (const [index, childNode] of Object.entries(childNodes)) {
        const childYogaNode = buildLayout(childNode, options).yogaNode;
        yogaNode.insertChild(childYogaNode, parseInt(index));
      }
    }

    return node;
  }

  // Apply margin, padding, flex, etc styles
  applyStyles(yogaNode, style);

  // Nodes with only text have a child Yoga node dedicated for that text
  if (node.textContent || node.nodeValue) {
    const { width, height } = measureText(node.textContent || node.nodeValue);
    yogaNode.setWidth(style.width || width);
    yogaNode.setHeight(style.height || height);

    return node;
  }

  if (Array.isArray(node.childNodes) && node.childNodes.length > 0) {
    const childNodes = node.childNodes.filter(childNode => {
      return skipStaticElements ? !childNode.unstable__static : true;
    });

    for (const [index, childNode] of Object.entries(childNodes)) {
      const { yogaNode: childYogaNode } = buildLayout(childNode, options);
      yogaNode.insertChild(childYogaNode, parseInt(index));
    }
  }

  return node;
};

export default buildLayout;
