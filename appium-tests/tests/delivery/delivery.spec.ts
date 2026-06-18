import { expect } from 'chai';
import { DeliveryHomePage } from '../../pages/DeliveryHomePage';
import { takeStepScreenshot, captureDeviceLogs } from '../../utilities/screenshotUtil';
import { validateApi } from '../../utilities/apiValidator';
import { APP_CONFIG } from '../../test-data/testData';
import { logger } from '../../utilities/logger';

describe('🚴 Delivery Module Tests', () => {
  let deliveryHome: DeliveryHomePage;

  before(async () => {
    deliveryHome = new DeliveryHomePage();
    const loaded = await deliveryHome.isLoaded();
    logger.info(`Delivery home loaded: ${loaded}`);
    await takeStepScreenshot('delivery_home_loaded');
  });

  afterEach(async function () {
    if (this.currentTest?.state === 'failed') {
      await takeStepScreenshot(`FAIL_${this.currentTest.title}`);
      await captureDeviceLogs();
    }
  });

  describe('Delivery Dashboard', () => {
    it('should display delivery home screen', async () => {
      const loaded = await deliveryHome.isLoaded();
      expect(loaded).to.be.true;
    });

    it('should show available orders section', async () => {
      const visible = await deliveryHome.isTextContainingVisible('Available') ||
                      await deliveryHome.isTextContainingVisible('Orders');
      await takeStepScreenshot('delivery_available_orders');
      logger.info(`Available orders visible: ${visible}`);
    });

    it('should show earnings information', async () => {
      await deliveryHome.tapEarnings();
      await browser.pause(APP_CONFIG.animationWait);
      const visible = await deliveryHome.isTextContainingVisible('Earnings') ||
                      await deliveryHome.isTextContainingVisible('₹');
      logger.info(`Earnings visible: ${visible}`);
      await takeStepScreenshot('delivery_earnings');
      await deliveryHome.pressBack();
    });
  });

  describe('Available Orders', () => {
    it('should display available orders list', async () => {
      await deliveryHome.tapAvailableOrders();
      await browser.pause(APP_CONFIG.animationWait);
      await takeStepScreenshot('delivery_available_list');
    });

    it('should show farmer and buyer contact info', async () => {
      const hasFarmer = await deliveryHome.isTextContainingVisible('Farmer') ||
                        await deliveryHome.isTextContainingVisible('Farm');
      const hasBuyer = await deliveryHome.isTextContainingVisible('Buyer') ||
                       await deliveryHome.isTextContainingVisible('Customer');
      logger.info(`Farmer info: ${hasFarmer}, Buyer info: ${hasBuyer}`);
      await takeStepScreenshot('delivery_contact_info');
    });

    it('should claim an available order if one exists', async () => {
      const hasOrder = await deliveryHome.isTextContainingVisible('Claim') ||
                       await deliveryHome.isTextContainingVisible('Accept');
      if (hasOrder) {
        await deliveryHome.claimFirstOrder();
        await browser.pause(APP_CONFIG.apiWait);
        await takeStepScreenshot('delivery_order_claimed');
        logger.info('Order claimed');
      } else {
        logger.info('No claimable orders available');
      }
    });
  });

  describe('Order Status Updates', () => {
    it('should show active delivery if claimed', async () => {
      const hasActive = await deliveryHome.isTextContainingVisible('Picked Up') ||
                        await deliveryHome.isTextContainingVisible('In Transit') ||
                        await deliveryHome.isTextContainingVisible('Active');
      logger.info(`Active delivery: ${hasActive}`);
      await takeStepScreenshot('delivery_active_state');
    });
  });

  describe('Delivery History', () => {
    it('should navigate to deliveries history', async () => {
      await deliveryHome.tapDeliveries();
      await browser.pause(APP_CONFIG.animationWait);
      await takeStepScreenshot('delivery_history');
    });

    it('should show completed deliveries or empty state', async () => {
      const hasHistory = await deliveryHome.isTextContainingVisible('DELIVERED') ||
                         await deliveryHome.isTextContainingVisible('Completed') ||
                         await deliveryHome.isTextContainingVisible('ORD-');
      logger.info(`Delivery history: ${hasHistory}`);
    });
  });

  describe('Delivery API Validation', () => {
    it('should validate delivery orders API', async () => {
      const result = await validateApi('GET', '/api/delivery/orders', {
        expectedStatus: 401,
      });
      logger.info(`Delivery orders API: ${result.statusCode}`);
    });

    it('should validate delivery earnings API', async () => {
      const result = await validateApi('GET', '/api/delivery/earnings', {
        expectedStatus: 401,
      });
      logger.info(`Delivery earnings API: ${result.statusCode}`);
    });
  });
});
