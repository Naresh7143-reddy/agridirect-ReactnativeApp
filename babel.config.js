module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json', '.native.js'],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@api': './src/api',
          '@store': './src/store',
          '@hooks': './src/hooks',
          '@theme': './src/theme',
          '@types': './src/types',
          '@utils': './src/utils',
          '@navigation': './src/navigation',
          '@assets': './src/assets',
        },
      },
    ],
    ['react-native-reanimated/plugin'],
  ],
};
