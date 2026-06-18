import type { Options } from '@wdio/types';
import path from 'path';

const APK_PATH = process.env.APK_PATH ||
  path.resolve(__dirname, '../../android/app/build/outputs/apk/release/app-release.apk');

export const config: Options.Testrunner = {
  runner: 'local',
  port: 4723,

  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:app': APK_PATH,
    'appium:appPackage': 'com.agridirect',
    'appium:appActivity': 'com.agridirect.MainActivity',
    'appium:deviceName': process.env.ANDROID_DEVICE || 'emulator-5554',
    'appium:platformVersion': process.env.ANDROID_VERSION || '14.0',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 120,
    'appium:androidInstallTimeout': 90000,
    'appium:uiautomator2ServerInstallTimeout': 60000,
    'appium:adbExecTimeout': 60000,
    'appium:ignoreHiddenApiPolicyError': true,
    'appium:disableWindowAnimation': true,
    'appium:settings[waitForSelectorTimeout]': 10000,
  }],

  specs: ['../tests/**/*.spec.ts'],
  exclude: [],

  maxInstances: 1,
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 15000,
  connectionRetryTimeout: 180000,
  connectionRetryCount: 3,

  services: [
    ['appium', {
      command: 'appium',
      args: {
        relaxedSecurity: true,
        log: path.resolve(__dirname, '../logs/appium.log'),
      },
    }],
  ],

  framework: 'mocha',
  reporters: [
    'spec',
    ['allure', {
      outputDir: path.resolve(__dirname, '../reports/allure-results'),
      disableWebdriverStepsReporting: false,
      disableWebdriverScreenshotsReporting: false,
    }],
  ],

  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
    retries: 2,
  },

  before: async (_capabilities, _specs, browser) => {
    await browser.setImplicitTimeout(0);
  },

  afterTest: async (test, _context, { error, passed }) => {
    if (!passed && error) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const name = test.title.replace(/\s+/g, '_').slice(0, 50);
      const screenshotPath = path.resolve(
        __dirname, `../screenshots/FAIL_${name}_${timestamp}.png`
      );
      await browser.saveScreenshot(screenshotPath);
    }
  },
};
