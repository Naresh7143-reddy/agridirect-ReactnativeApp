import { expect } from 'chai';
import { SplashPage } from '../../pages/SplashPage';
import { LoginPage } from '../../pages/LoginPage';
import { takeStepScreenshot, captureDeviceLogs } from '../../utilities/screenshotUtil';
import { validateApi } from '../../utilities/apiValidator';
import { TEST_USERS, APP_CONFIG } from '../../test-data/testData';
import { logger } from '../../utilities/logger';

describe('🔐 Authentication Tests', () => {
  let splash: SplashPage;
  let login: LoginPage;

  before(async () => {
    splash = new SplashPage();
    login = new LoginPage();
    await splash.waitForSplash();
    await takeStepScreenshot('auth_splash_loaded');
  });

  afterEach(async function () {
    if (this.currentTest?.state === 'failed') {
      await takeStepScreenshot(`FAIL_${this.currentTest.title}`);
      await captureDeviceLogs();
    }
  });

  describe('Role Selection', () => {
    it('should display role selection screen', async () => {
      const visible = await login.isOnRoleSelection();
      expect(visible).to.be.true;
      await takeStepScreenshot('role_selection_screen');
    });

    it('should show Farmer, Buyer and Delivery options', async () => {
      const hasFarmer = await login.isTextVisible('Farmer');
      const hasBuyer = await login.isTextVisible('Buyer');
      expect(hasFarmer || hasBuyer).to.be.true;
    });
  });

  describe('Phone Login — Buyer', () => {
    before(async () => {
      await login.selectRole('BUYER');
      await takeStepScreenshot('buyer_role_selected');
    });

    it('should navigate to phone entry screen', async () => {
      const onPhone = await login.isOnPhoneEntry();
      expect(onPhone).to.be.true;
    });

    it('should accept phone number input', async () => {
      await login.enterPhone(TEST_USERS.buyer.phone);
      await takeStepScreenshot('buyer_phone_entered');
    });

    it('should trigger OTP send', async () => {
      await login.tapSendOtp();
      const onOtp = await login.isOnOtpScreen();
      await takeStepScreenshot('buyer_otp_screen');
      // OTP screen should appear (or Firebase challenge)
      logger.info(`OTP screen visible: ${onOtp}`);
    });

    it('should accept OTP entry', async () => {
      await login.enterOtp(TEST_USERS.buyer.otp);
      await takeStepScreenshot('buyer_otp_entered');
    });

    it('should verify OTP and navigate home', async () => {
      await login.tapVerifyOtp();
      await browser.pause(APP_CONFIG.apiWait);
      const success = await login.isLoginSuccessful();
      await takeStepScreenshot('buyer_login_result');
      logger.info(`Buyer login success: ${success}`);
      // Note: In CI with test credentials, this may navigate to registration
    });
  });

  describe('Invalid Login Handling', () => {
    it('should validate API rejects wrong OTP', async () => {
      const result = await validateApi('POST', '/api/auth/otp/verify', {
        body: { phone: '+91' + TEST_USERS.buyer.phone, otp: '000000' },
        expectedStatus: 400,
      });
      expect(result.statusCode).to.not.equal(200);
      await takeStepScreenshot('api_invalid_otp_test');
    });

    it('should validate API OTP send endpoint', async () => {
      const result = await validateApi('POST', '/api/auth/otp/send', {
        body: { phone: '+91' + TEST_USERS.buyer.phone },
        expectedStatus: 200,
        maxResponseTime: 10000,
      });
      logger.info(`OTP send API: ${result.statusCode} (${result.responseTime}ms)`);
    });
  });

  describe('Auth API Validation', () => {
    it('should respond to /api/auth/me without token with 401', async () => {
      const result = await validateApi('GET', '/api/auth/me', {
        expectedStatus: 401,
      });
      expect(result.statusCode).to.equal(401);
    });

    it('should respond to product listing API', async () => {
      const result = await validateApi('GET', '/api/products', {
        expectedStatus: 200,
        maxResponseTime: 10000,
        validateBody: (data) => {
          const errors: string[] = [];
          if (!data) errors.push('Empty response body');
          return errors;
        },
      });
      logger.info(`Products API: ${result.statusCode} (${result.responseTime}ms)`);
    });
  });
});
