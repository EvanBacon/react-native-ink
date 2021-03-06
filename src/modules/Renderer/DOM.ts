import Yoga from '../Yoga';
import measureText from './measure-text';
import applyStyle from './apply-styles';

export type CLIElementStyle = { [key: string]: any };

export type CLIElement = {
  onImmediateRender?: Function;
  onRender?: Function;
  unstable__transformChildren?: any;
  isStaticDirty?: boolean;
  unstable__static?: boolean;
  nodeName: string;
  nodeValue?: any;
  style?: CLIElementStyle;
  attributes?: any;
  childNodes: CLIElement[];
  parentNode?: CLIElement | null;
  textContent?: string | null;
  yogaNode: Yoga.YogaNode;
};

// Helper utilities implementing some common DOM methods to simplify reconciliation code
export const createNode = (tagName: string): CLIElement => ({
  nodeName: tagName.toUpperCase(),
  style: {},
  attributes: {},
  childNodes: [],
  parentNode: null,
  textContent: null,
  yogaNode: Yoga.Node.create(),
});

export const appendChildNode = (
  node: CLIElement,
  childNode: CLIElement,
): void => {
  if (childNode.parentNode) {
    removeChildNode(childNode.parentNode, childNode);
  }

  childNode.parentNode = node;

  node.childNodes.push(childNode);
  node.yogaNode.insertChild(childNode.yogaNode, node.yogaNode.getChildCount());
};

export const insertBeforeNode = (
  node: CLIElement,
  newChildNode: CLIElement,
  beforeChildNode: CLIElement,
) => {
  if (newChildNode.parentNode) {
    removeChildNode(newChildNode.parentNode, newChildNode);
  }

  newChildNode.parentNode = node;

  const index = node.childNodes.indexOf(beforeChildNode);
  if (index >= 0) {
    node.childNodes.splice(index, 0, newChildNode);
    node.yogaNode.insertChild(newChildNode.yogaNode, index);
    return;
  }

  node.childNodes.push(newChildNode);
  node.yogaNode.insertChild(
    newChildNode.yogaNode,
    node.yogaNode.getChildCount(),
  );
};

export const removeChildNode = (
  node: CLIElement,
  removeNode: CLIElement,
): void => {
  if (removeNode.parentNode)
    removeNode.parentNode.yogaNode.removeChild(removeNode.yogaNode);
  removeNode.parentNode = null;

  const index = node.childNodes.indexOf(removeNode);
  if (index >= 0) {
    node.childNodes.splice(index, 1);
  }
};

export const setStyle = (node: CLIElement, style: CLIElementStyle) => {
  node.style = style;
  applyStyle(node.yogaNode, style);
};

export const setAttribute = (
  node: CLIElement,
  key: string,
  value: any,
): void => {
  node.attributes[key] = value;
};

export const createTextNode = (text: string | any) => {
  const node: CLIElement = {
    nodeName: '#text',
    childNodes: [],
    nodeValue: text,
    yogaNode: Yoga.Node.create(),
  };

  setTextContent(node, text);

  return node;
};

export const setTextContent = (node: CLIElement, text: string | any): void => {
  if (typeof text !== 'string') {
    text = String(text);
  }

  let width = 0;
  let height = 0;

  if (text.length > 0) {
    const dimensions = measureText(text);
    width = dimensions.width;
    height = dimensions.height;
  }

  if (node.nodeName === '#text') {
    node.nodeValue = text;
    node.yogaNode.setWidth(width);
    node.yogaNode.setHeight(height);
  } else {
    node.textContent = text;
    node.yogaNode.setWidth(node.style!.width || width);
    node.yogaNode.setHeight(node.style!.height || height);
  }
};
