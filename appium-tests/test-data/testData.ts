export const TEST_USERS = {
  buyer: {
    phone: '9876543210',
    name: 'Test Buyer',
    otp: '123456',
    role: 'BUYER',
  },
  farmer: {
    phone: '9123456780',
    name: 'Test Farmer',
    otp: '123456',
    role: 'FARMER',
    farmName: 'Green Valley Farm',
    location: 'Hyderabad, Telangana',
    landAcres: '5',
  },
  delivery: {
    phone: '9000011111',
    name: 'Test Delivery',
    otp: '123456',
    role: 'DELIVERY',
    vehicleType: 'Bike',
    licenseNo: 'TS09AB1234',
  },
};

export const TEST_PRODUCT = {
  name: 'Fresh Tomatoes Test',
  description: 'Organically grown fresh tomatoes for testing',
  price: '50',
  unit: 'kg',
  stock: '100',
  minOrderQty: '1',
  category: 'Vegetables',
};

export const TEST_ADDRESS = {
  line1: '123 Test Street',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500001',
};

export const API_CONFIG = {
  baseUrl: 'https://agridirect-backend-80yz.onrender.com',
  timeout: 30000,
};

export const APP_CONFIG = {
  packageName: 'com.agridirect',
  splashWait: 4000,
  animationWait: 1000,
  apiWait: 8000,
  shortWait: 2000,
};
