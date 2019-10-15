module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: true,
        },
      },
    ],
    '@babel/preset-react',
    [
      '@babel/preset-typescript',
      {
        isTSX: true,
        allExtensions: true,
      },
    ],
  ],
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
