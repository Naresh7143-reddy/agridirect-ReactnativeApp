import { config as baseConfig } from './wdio.conf';
import type { Options } from '@wdio/types';
import path from 'path';

export const config: Options.Testrunner = {
  ...baseConfig,

  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:app': process.env.APK_PATH || path.resolve(
      __dirname, '../../android/app/build/outputs/apk/release/app-release.apk'
    ),
    'appium:appPackage': 'com.agridirect',
    'appium:appActivity': 'com.agridirect.MainActivity',
    'appium:deviceName': 'emulator-5554',
    'appium:platformVersion': '14.0',
    'appium:avd': 'Pixel_6_API_34',
    'appium:avdLaunchTimeout': 180000,
    'appium:avdReadyTimeout': 180000,
    'appium:noReset': false,
    'appium:fullReset': true,
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 180,
    'appium:androidInstallTimeout': 120000,
    'appium:uiautomator2ServerInstallTimeout': 90000,
    'appium:ignoreHiddenApiPolicyError': true,
    'appium:disableWindowAnimation': true,
    'appium:skipDeviceInitialization': false,
    'appium:chromeDriverAutodownload': true,
  }],

  logLevel: 'warn',
  bail: 0,

  reporters: [
    'spec',
    ['allure', {
      outputDir: path.resolve(__dirname, '../reports/allure-results'),
      disableWebdriverStepsReporting: false,
      disableWebdriverScreenshotsReporting: false,
    }],
    ['json', {
      outputDir: path.resolve(__dirname, '../reports'),
      filename: 'wdio-results.json',
    }],
  ],

  mochaOpts: {
    ...baseConfig.mochaOpts,
    timeout: 180000,
    retries: 3,
  },
};
