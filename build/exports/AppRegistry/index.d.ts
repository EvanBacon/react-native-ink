import { ComponentType } from 'react';
export declare type ComponentProvider = () => ComponentType<any>;
export declare type ComponentProviderInstrumentationHook = (component: ComponentProvider) => ComponentType<any>;
export declare type WrapperComponentProvider = (props: any) => ComponentType<any>;
export declare type AppConfig = {
    appKey: string;
    component?: ComponentProvider;
    run?: Function;
    section?: boolean;
};
/**
 * `AppRegistry` is the JS entry point to running all React Native apps.
 */
export default class AppRegistry {
    static getAppKeys(): Array<string>;
    static getApplication(appKey: string, appParameters?: Object): string;
    static registerComponent(appKey: string, componentProvider: ComponentProvider): string;
    static registerConfig(config: Array<AppConfig>): void;
    static registerRunnable(appKey: string, run: Function): string;
    static runApplication(appKey: string, appParameters: Object): void;
    static setComponentProviderInstrumentationHook(hook: ComponentProviderInstrumentationHook): void;
    static setWrapperComponentProvider(provider: WrapperComponentProvider): void;
    static unmountApplicationComponentAtRootTag(rootTag: Object): void;
}
