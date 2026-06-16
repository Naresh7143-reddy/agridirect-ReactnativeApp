module.exports = {
  getCurrentPosition: jest.fn((success) =>
    success({ coords: { latitude: 0, longitude: 0 } }),
  ),
  watchPosition: jest.fn(() => 1),
  clearWatch: jest.fn(),
  requestAuthorization: jest.fn(),
  setRTCRequested: jest.fn(),
};
