<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>react-native-ink</code>
</h1>

<!-- Header -->

<p align="center">
    <b>A library for creating CLIs with agnostic primitives like View, Text, Image, TextInput, etc...</b>
    <br/>
    <br/>
  <a aria-label="Well tested React library" href="https://github.com/evanbacon/react-native-ink/actions">
    <img align="center" alt="GitHub Actions status" src="https://github.com/evanbacon/react-native-ink/workflows/Check%20Universal%20Module/badge.svg">
  </a>
</p>

---

<!-- Body -->

## 🏁 Setup

Install `react-native-ink` in your project.

```sh
yarn add react-native-ink
```

Alias `react-native` to `react-native-ink`:

1. `yarn add -D babel-plugin-module-resolver`
2. Create alias:
   `babel.config.js`

   ```js
   module.exports = {
     // ...
     plugins: [
       [
         'babel-plugin-module-resolver',
         {
           alias: {
             'react-native': 'react-native-ink',
           },
         },
       ],
     ],
   };
   ```

## ⚽️ Usage

```tsx
import React, { useEffect, useState } from 'react';
import { AppRegistry, View, Text, Image, TextInput } from 'react-native';

const Counter = () => {
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

AppRegistry.registerComponent('main', () => Counter);
```

## License

The Expo source code is made available under the [MIT license](LICENSE). Some of the dependencies are licensed differently, with the BSD license, for example.

<!-- Footer -->

---

<p>
    <a aria-label="sponsored by expo" href="http://expo.io">
        <img src="https://img.shields.io/badge/SPONSORED%20BY%20EXPO-4630EB.svg?style=for-the-badge" target="_blank" />
    </a>
    <a aria-label="React Native for CLIs is free to use" href="/LICENSE" target="_blank">
        <img align="right" alt="License: MIT" src="https://img.shields.io/badge/License-MIT-success.svg?style=for-the-badge&color=33CC12" target="_blank" />
    </a>
</p>
