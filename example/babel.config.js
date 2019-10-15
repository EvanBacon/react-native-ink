module.exports = function(api) {
  api.cache(true);
  return {
    // presets: ['@expo/babel-preset-cli'],
    plugins: [
      [
        'babel-plugin-module-resolver',
        {
          alias: {
            'react-native': '../build/index.js',
          },
        },
      ],
    ],
  };
};
