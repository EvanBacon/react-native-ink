import { ComponentType } from 'react';
import { render } from 'ink';

const runnables = {};

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
    render(<App />);

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

  static runApplication(appKey: string, appParameters: Object): void {
    throw new Error('NO_IMP');
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
