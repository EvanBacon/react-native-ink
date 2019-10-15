"use strict";
exports.__esModule = true;
var ink_1 = require("ink");
var runnables = {};
/**
 * `AppRegistry` is the JS entry point to running all React Native apps.
 */
var AppRegistry = /** @class */ (function () {
    function AppRegistry() {
    }
    AppRegistry.getAppKeys = function () {
        return Object.keys(runnables);
    };
    AppRegistry.getApplication = function (appKey, appParameters) {
        return runnables[appKey].getApplication(appParameters);
    };
    AppRegistry.registerComponent = function (appKey, componentProvider) {
        var App = componentProvider();
        ink_1.render(<App />);
        return appKey;
    };
    AppRegistry.registerConfig = function (config) {
        throw new Error('NO_IMP');
    };
    // TODO: fix style sheet creation when using this method
    AppRegistry.registerRunnable = function (appKey, run) {
        throw new Error('NO_IMP');
        return appKey;
    };
    AppRegistry.runApplication = function (appKey, appParameters) {
        throw new Error('NO_IMP');
    };
    AppRegistry.setComponentProviderInstrumentationHook = function (hook) {
        throw new Error('NO_IMP');
    };
    AppRegistry.setWrapperComponentProvider = function (provider) {
        throw new Error('NO_IMP');
    };
    AppRegistry.unmountApplicationComponentAtRootTag = function (rootTag) {
        throw new Error('NO_IMP');
    };
    return AppRegistry;
}());
exports["default"] = AppRegistry;
