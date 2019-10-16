import React, { FunctionComponent } from 'react';
import { Color, useInput } from 'ink';
// @ts-ignore
import { Text, View } from 'react-native-ink';
// @ts-ignore
// import { View } from 'react-native-web';

interface IProps {
  name?: string;
}
const InkBoilerplate: FunctionComponent<IProps> = ({ name = 'Someone' }) => {
  useInput(input => {
    if (input === 'q') {
      process.exit(0);
    }
  });

  return (
    <>
      <View style={{ padding: 1, backgroundColor: 'red' }}>
        <Text style={{ color: 'orange' }}>Hello, {name}.</Text>
      </View>
      <View marginTop={1}>
        <Color redBright>Press 'q' for exit</Color>
      </View>
    </>
  );
};

export default InkBoilerplate;
