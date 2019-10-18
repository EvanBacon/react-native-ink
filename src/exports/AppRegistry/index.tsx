#!/usr/bin/env node

import React, { ComponentType } from 'react';
import meow from 'meow';

const runnables: { [key: string]: any } = {};

export type ComponentProvider = () => ComponentType<any>;
export type ComponentProviderInstrumentationHook = (
  component: ComponentProvider,
) => ComponentType<any>;
export type WrapperComponentProvider = (props: any) => ComponentType<any>;

export type AppConfig = {
  appKey: string;
  component?: ComponentProvider;
  run?: Function;
  section?: boolean;
};

import Instance from '../../Modules/Instance';
import instances from '../../Modules/Instance/instances';

/**
 * `AppRegistry` is the JS entry point to running all React Native apps.
 */
export default class AppRegistry {
  static getAppKeys(): Array<string> {
    return Object.keys(runnables);
  }

  static getApplication(appKey: string, appParameters?: Object): string {
    return runnables[appKey].getApplication(appParameters);
  }

  static registerComponent(
    appKey: string,
    componentProvider: ComponentProvider,
  ): string {
    const App = componentProvider();
    runnables[appKey] = App;
    return appKey;
  }

  static registerConfig(config: Array<AppConfig>) {
    throw new Error('NO_IMP');
  }

  // TODO: fix style sheet creation when using this method
  static registerRunnable(appKey: string, run: Function): string {
    throw new Error('NO_IMP');
    return appKey;
  }

  static runApplication(appKey: string, appParameters: Object): any {
    const cli = meow(appParameters);
    const App = runnables[appKey];
    const node = React.createElement(App, cli.flags);
    let options: any = {};

    // Stream was passed instead of `options` object
    if (typeof options.write === 'function') {
      options = {
        stdout: options,
        stdin: process.stdin,
      };
    }

    options = {
      stdout: process.stdout,
      stdin: process.stdin,
      debug: false,
      exitOnCtrlC: true,
      experimental: false,
      ...options,
    };

    let instance: any;
    if (instances.has(options.stdout)) {
      instance = instances.get(options.stdout);
    } else {
      instance = new Instance(options);
      instances.set(options.stdout, instance);
    }

    instance.render(node);

    return {
      rerender: instance.render,
      unmount: () => instance.unmount(),
      waitUntilExit: instance.waitUntilExit,
      cleanup: () => instances.delete(options.stdout),
    };
  }

  static setComponentProviderInstrumentationHook(
    hook: ComponentProviderInstrumentationHook,
  ) {
    throw new Error('NO_IMP');
  }

  static setWrapperComponentProvider(provider: WrapperComponentProvider) {
    throw new Error('NO_IMP');
  }

  static unmountApplicationComponentAtRootTag(rootTag: Object) {
    throw new Error('NO_IMP');
  }
}
