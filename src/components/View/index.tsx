import { Box } from 'ink';
import React from 'react';

// @ts-ignore
export default function View({ style, ...props }) {
  return <Box {...props} {...style} />;
}
