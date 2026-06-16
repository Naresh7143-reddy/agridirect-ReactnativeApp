module.exports = {
  preset: '@react-native/jest-preset',
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/android/', '/ios/'],
  setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js'],
  moduleNameMapper: {
    '^react-native-reanimated$': '<rootDir>/__mocks__/react-native-reanimated.js',
    '^react-native-worklets$': '<rootDir>/__mocks__/react-native-worklets.js',
    '^@react-native-community/geolocation$': '<rootDir>/__mocks__/geolocation.js',
    '^react-native-vector-icons/(.*)$': '<rootDir>/__mocks__/vector-icons.js',
    '^lottie-react-native$': '<rootDir>/__mocks__/lottie.js',
    '^react-native-toast-message$': '<rootDir>/__mocks__/toast.js',
    '^react-native-haptic-feedback$': '<rootDir>/__mocks__/haptic.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-redux|@reduxjs|redux-persist|@react-navigation|react-native-.*|@tanstack|@react-native-community|immer)/)',
  ],
};
