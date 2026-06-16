/**
 * AgriDirect — Environment configuration
 *
 * Switch between development and production by setting __DEV__ (automatic
 * in Metro) or by passing --mode=release to the build command.
 */

interface EnvConfig {
  API_URL: string;
  RAZORPAY_KEY: string;
  APP_NAME: string;
  SUPPORT_PHONE: string;
  SUPPORT_EMAIL: string;
}

const development: EnvConfig = {
  API_URL: 'https://agridirect-backend-80yz.onrender.com', // prod backend for device testing
  RAZORPAY_KEY: 'rzp_test_SwdZmhaJQfFvHZ',  // Test key — safe to commit
  APP_NAME: 'AgriDirect Dev',
  SUPPORT_PHONE: '+919876543210',
  SUPPORT_EMAIL: 'support@agridirect.app',
};

const production: EnvConfig = {
  API_URL: 'https://agridirect-backend-80yz.onrender.com',
  RAZORPAY_KEY: 'rzp_live_REPLACE_WITH_LIVE_KEY', // ⚠️ Replace before Play Store release
  APP_NAME: 'AgriDirect',
  SUPPORT_PHONE: '+919876543210',
  SUPPORT_EMAIL: 'support@agridirect.app',
};

/**
 * Active config — automatically switches based on Metro's __DEV__ flag.
 * In release builds __DEV__ is false, so production config is used.
 */
export const ENV: EnvConfig = __DEV__ ? development : production;

export default ENV;
