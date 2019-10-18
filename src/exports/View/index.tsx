/* eslint-disable camelcase */
import React, {
  forwardRef,
  MutableRefObject,
  Ref,
  RefForwardingComponent,
  useImperativeHandle,
  useRef,
} from 'react';

import ViewPropTypes from './ViewPropTypes';

const ViewRef: RefForwardingComponent<any, any> = (
  { children, unstable__transformChildren, style }: any,
  ref: Ref<any>,
) => {
  const nodeRef: MutableRefObject<any> = useRef(null);

  useImperativeHandle(ref, () => ({
    unstable__getComputedWidth: (): number => {
      if (!nodeRef || !nodeRef.current) {
        return 0;
      }

      return nodeRef.current.yogaNode.getComputedWidth();
    },
  }));

  const props: any = {
    ref: nodeRef,
    style,
    unstable__transformChildren,
  };

  return <div {...props}>{children}</div>;
};

const View: any = forwardRef(ViewRef);

View.propTypes = ViewPropTypes;

View.defaultProps = {
  flexDirection: 'column',
  flexGrow: 0,
  flexShrink: 1,
};

export default View;
