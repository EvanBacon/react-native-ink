import { Box } from 'ink';
import React from 'react';

export default function View({ style, ...props }) {
  return <Box {...props} {...style} />;
}
