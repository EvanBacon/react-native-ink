#!/usr/bin/env node
import React from 'react';

import { AppRegistry, View, Text } from './build';

const InkBoilerplate = ({ name = 'Someone' }) => {
  return (
    <View>
      <Text
        style={{
          backgroundColor: 'blue',
          padding: 2,
          paddingRight: 1,
          margin: 1,
          marginTop: 3,
          marginLeft: 2,
          color: 'orange',
          textAlign: 'right',
          fontStyle: 'oblique',
          borderRightColor: 'cyan',
          borderTopColor: 'yellow',
          textDecorationStyle: 'underline',
          borderColor: 'purple',
        }}
      >
        Hello, {name}. <Text>BRO</Text>
      </Text>
      <Text style={{ color: 'white' }}>
        Test Basic{' '}
        <Text style={{ color: 'orange', textDecorationStyle: 'underline' }}>
          nested text
        </Text>
      </Text>
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
