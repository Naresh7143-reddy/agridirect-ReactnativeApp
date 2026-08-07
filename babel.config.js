module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json', '.native.js'],
        alias: {
          'react-native-reanimated': './src/utils/reanimatedStub.ts',
          'react-native-mmkv': './src/utils/mmkvStub.ts',
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
  ],
};
