#!/usr/bin/env node
import * as React from 'react';

import { AppRegistry, View, Text } from './build';
import AppContext from './build/exports/App/AppContext';
import useInput from './build/hooks/use-input';

// import { Box, Text } from 'ink';

const InkBoilerplate = ({ name = 'Someone' }) => {
  const { exit } = React.useContext(AppContext);

  const [direction, setDirection] = React.useState('column');
  const [color, setColor] = React.useState('blue');

  useInput((input: string) => {
    if (input === 'q') {
      exit();
    } else if (input === 'd') {
      setDirection(direction === 'column' ? 'row' : 'column');
      setColor(color === 'red' ? 'red' : 'blue');
    }
  });

  // const defStyle = {
  //   backgroundColor: 'blue',
  //   // padding: 2,
  //   // paddingRight: 1,
  //   // margin: 0,
  //   // marginTop: 3,
  //   // marginLeft: 2,
  //   color: 'orange',
  //   // textAlign: 'right',
  //   // fontStyle: 'oblique',
  //   // borderRightColor: 'cyan',
  //   // borderTopColor: 'yellow',
  //   // textDecorationStyle: 'underline',
  //   // borderColor: 'purple',
  // };

  return (
    <View style={{ flexDirection: direction, height: 7 }}>
      {[0, 1, 2, 3, 4].map(val => {
        return (
          <View key={val}>
            <Text style={{ color }}>Hello, {name}</Text>
          </View>
        );
      })}
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
