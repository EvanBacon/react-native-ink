import React, { useState, useEffect } from 'react';
import { Text, View } from 'react-native';

export default () => {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter(prevCounter => prevCounter + 1);
    });

    return () => {
      clearInterval(timer);
    };
  });

  return (
    <View style={{ padding: 1 }}>
      <Text style={{ color: 'green' }}>{counter} tests passed</Text>
    </View>
  );
};
