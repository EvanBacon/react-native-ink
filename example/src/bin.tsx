#!/usr/bin/env node
import InkBoilerplate from './App';

// @ts-ignore
import { AppRegistry } from '../../src';

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
