#!/usr/bin/env node
import InkBoilerplate from './App';

import { AppRegistry } from 'react-native-ink';

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
