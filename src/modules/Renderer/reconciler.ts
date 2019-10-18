import ReactReconciler from 'react-reconciler';
import {
  unstable_cancelCallback as cancelPassiveEffects,
  unstable_scheduleCallback as schedulePassiveEffects,
} from 'scheduler';

import {
  appendChildNode,
  CLIElement,
  CLIElementStyle,
  createNode,
  createTextNode,
  insertBeforeNode,
  removeChildNode,
  setAttribute,
  setStyle,
  setTextContent,
} from './DOM';

const NO_CONTEXT = true;

const hostConfig: any = {
  schedulePassiveEffects,
  cancelPassiveEffects,
  now: Date.now,
  getRootHostContext: () => NO_CONTEXT,
  prepareForCommit: () => {},
  resetAfterCommit: (rootNode: CLIElement) => {
    // Since renders are throttled at the instance level and <Static> component children
    // are rendered only once and then get deleted, we need an escape hatch to
    // trigger an immediate render to ensure <Static> children are written to output before they get erased
    if (rootNode.isStaticDirty) {
      rootNode.isStaticDirty = false;
      // @ts-ignore
      rootNode.onImmediateRender();
      return;
    }

    // @ts-ignore
    rootNode.onRender();
  },
  getChildHostContext: () => NO_CONTEXT,
  shouldSetTextContent: (type: string, props: any): boolean => {
    return (
      typeof props.children === 'string' || typeof props.children === 'number'
    );
  },
  createInstance: (type: string, newProps: any) => {
    const node = createNode(type);

    for (const [key, value] of Object.entries(newProps)) {
      if (key === 'children') {
        if (typeof value === 'string' || typeof value === 'number') {
          if (type === 'div') {
            // Text node must be wrapped in another node, so that text can be aligned within container
            const textNode = createNode('div');
            setTextContent(textNode, value);
            appendChildNode(node, textNode);
          }

          if (type === 'span') {
            setTextContent(node, value);
          }
        }
      } else if (key === 'style') {
        setStyle(node, value as CLIElementStyle);
      } else if (key === 'unstable__transformChildren') {
        node.unstable__transformChildren = value as Function; // eslint-disable-line camelcase
      } else if (key === 'unstable__static') {
        node.unstable__static = true; // eslint-disable-line camelcase
      } else {
        setAttribute(node, key, value);
      }
    }

    return node;
  },
  createTextInstance: createTextNode,
  resetTextContent: (node: CLIElement) => {
    if (node.textContent) {
      node.textContent = '';
    }

    if (node.childNodes.length > 0) {
      for (const childNode of node.childNodes) {
        removeChildNode(node, childNode);
      }
    }
  },
  getPublicInstance: (instance: any) => instance,
  appendInitialChild: appendChildNode,
  appendChild: appendChildNode,
  insertBefore: insertBeforeNode,
  finalizeInitialChildren: (
    node: CLIElement,
    type: string,
    props: any,
    rootNode: CLIElement,
  ) => {
    if (node.unstable__static) {
      rootNode.isStaticDirty = true;
    }
  },
  supportsMutation: true,
  appendChildToContainer: appendChildNode,
  insertInContainerBefore: insertBeforeNode,
  removeChildFromContainer: removeChildNode,
  prepareUpdate: (
    node: CLIElement,
    type: string,
    oldProps: any,
    newProps: any,
    rootNode: CLIElement,
  ) => {
    if (node.unstable__static) {
      rootNode.isStaticDirty = true;
    }

    return true;
  },
  commitUpdate: (
    node: CLIElement,
    updatePayload: boolean,
    type: string,
    oldProps: any,
    newProps: any,
  ) => {
    for (const [key, value] of Object.entries(newProps)) {
      if (key === 'children') {
        if (typeof value === 'string' || typeof value === 'number') {
          if (type === 'div') {
            // Text node must be wrapped in another node, so that text can be aligned within container
            // If there's no such node, a new one must be created
            if (node.childNodes.length === 0) {
              const textNode = createNode('div');
              setTextContent(textNode, value);
              appendChildNode(node, textNode);
            } else {
              setTextContent(node.childNodes[0], value);
            }
          }

          if (type === 'span') {
            setTextContent(node, value);
          }
        }
      } else if (key === 'style') {
        setStyle(node, value as CLIElementStyle);
      } else if (key === 'unstable__transformChildren') {
        node.unstable__transformChildren = value as Function; // eslint-disable-line camelcase
      } else if (key === 'unstable__static') {
        node.unstable__static = true; // eslint-disable-line camelcase
      } else {
        setAttribute(node, key, value);
      }
    }
  },
  commitTextUpdate: (node: CLIElement, oldText: string, newText: string) => {
    setTextContent(node, newText);
  },
  removeChild: removeChildNode,
};

export default ReactReconciler(hostConfig); // eslint-disable-line new-cap
