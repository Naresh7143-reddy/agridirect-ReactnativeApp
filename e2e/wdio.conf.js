/**
 * WebdriverIO + Appium config for AgriDirect end-to-end tests.
 *
 * Drives the installed APK on a USB-connected Android phone (or BlueStacks)
 * via the Appium server (UiAutomator2 driver). Tests are written with the
 * same Selenium WebDriver protocol you already know.
 *
 * Run:
 *   1. Start Appium in one terminal:    appium
 *   2. Plug your phone in (or open BlueStacks), USB debugging ON
 *   3. In another terminal:             npm run e2e
 */

const path = require('path');

exports.config = {
  runner: 'local',

  // Appium server
  hostname: '127.0.0.1',
  port: 4723,
  path: '/',

  // Tests to run
  specs: [
    path.join(__dirname, 'specs/**/*.spec.js'),
  ],

  // Single device, single test at a time (easier to watch)
  maxInstances: 1,

  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Android Device',
    // Already-installed app — no need to re-install each run
    'appium:appPackage': 'com.agridirect',
    'appium:appActivity': 'com.agridirect.MainActivity',
    'appium:noReset': true,            // keep login state between tests
    'appium:newCommandTimeout': 240,
    'appium:autoGrantPermissions': true,
  }],

  logLevel: 'info',
  bail: 0,                    // don't stop on first failure
  baseUrl: '',
  waitforTimeout: 30000,      // 30 sec for slow RN renders
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 180000,          // 3 min per test (Render cold start tolerance)
  },
};
