#!/usr/bin/env node
import { Color, useInput } from 'ink';
import React from 'react';

import { AppRegistry, Text, View } from './build';

const InkBoilerplate = ({ name = 'Someone' }) => {
  useInput(input => {
    if (input === 'q') {
      process.exit(0);
    }
  });

  return (
    <View>
      <View style={{ padding: 1, backgroundColor: 'red' }}>
        <Text style={{ color: 'orange' }}>Hello, {name}.</Text>
      </View>
      <View marginTop={1}>
        <Color redBright>Press 'q' for exit</Color>
      </View>
    </View>
  );
};

// @ts-ignore
AppRegistry.registerComponent('main', () => InkBoilerplate);
AppRegistry.runApplication(
  'main',
  `
Usage
  $ inkboilerplate
Options
  --name  Your name
Examples
  $ inkboilerplate --name=John
  Hello, John. From Ink Boilerplate
`,
);
