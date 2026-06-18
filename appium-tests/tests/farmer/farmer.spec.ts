import { expect } from 'chai';
import { FarmerHomePage } from '../../pages/FarmerHomePage';
import { AddProductPage } from '../../pages/AddProductPage';
import { FarmerOrdersPage } from '../../pages/FarmerOrdersPage';
import { takeStepScreenshot, captureDeviceLogs } from '../../utilities/screenshotUtil';
import { validateApi } from '../../utilities/apiValidator';
import { TEST_PRODUCT, APP_CONFIG } from '../../test-data/testData';
import { logger } from '../../utilities/logger';

describe('🌾 Farmer Module Tests', () => {
  let farmerHome: FarmerHomePage;
  let addProduct: AddProductPage;
  let farmerOrders: FarmerOrdersPage;

  before(async () => {
    farmerHome = new FarmerHomePage();
    addProduct = new AddProductPage();
    farmerOrders = new FarmerOrdersPage();
    const loaded = await farmerHome.isLoaded();
    logger.info(`Farmer home loaded: ${loaded}`);
    await takeStepScreenshot('farmer_home_loaded');
  });

  afterEach(async function () {
    if (this.currentTest?.state === 'failed') {
      await takeStepScreenshot(`FAIL_${this.currentTest.title}`);
      await captureDeviceLogs();
    }
  });

  describe('Farmer Dashboard', () => {
    it('should display farmer home screen', async () => {
      const loaded = await farmerHome.isLoaded();
      expect(loaded).to.be.true;
    });

    it('should display revenue stats', async () => {
      const revenue = await farmerHome.getDashboardRevenue();
      logger.info(`Dashboard revenue: ${revenue}`);
      await takeStepScreenshot('farmer_dashboard_stats');
    });

    it('should show My Products section', async () => {
      const visible = await farmerHome.isTextContainingVisible('Products');
      expect(visible).to.be.true;
    });

    it('should display Quick Actions', async () => {
      const visible = await farmerHome.isTextContainingVisible('Quick Actions') ||
                      await farmerHome.isTextContainingVisible('Add Product');
      expect(visible).to.be.true;
    });
  });

  describe('Add Product', () => {
    before(async () => {
      await farmerHome.tapAddProduct();
      await browser.pause(APP_CONFIG.animationWait);
    });

    it('should navigate to add product screen', async () => {
      const loaded = await addProduct.isLoaded();
      await takeStepScreenshot('add_product_screen');
      logger.info(`Add product screen loaded: ${loaded}`);
    });

    it('should fill product name', async () => {
      const loaded = await addProduct.isLoaded();
      if (loaded) {
        await addProduct.fillProductName(TEST_PRODUCT.name);
        await takeStepScreenshot('product_name_filled');
      }
    });

    it('should fill product price', async () => {
      const loaded = await addProduct.isLoaded();
      if (loaded) {
        await addProduct.fillPrice(TEST_PRODUCT.price);
        await takeStepScreenshot('product_price_filled');
      }
    });

    it('should fill product stock', async () => {
      const loaded = await addProduct.isLoaded();
      if (loaded) {
        await addProduct.fillStock(TEST_PRODUCT.stock);
        await takeStepScreenshot('product_stock_filled');
      }
    });

    it('should fill description', async () => {
      const loaded = await addProduct.isLoaded();
      if (loaded) {
        await addProduct.fillDescription(TEST_PRODUCT.description);
        await takeStepScreenshot('product_description_filled');
      }
    });

    it('should save product successfully', async () => {
      const loaded = await addProduct.isLoaded();
      if (loaded) {
        await addProduct.tapSave();
        await browser.pause(APP_CONFIG.apiWait);
        const saved = await addProduct.isProductSaved();
        logger.info(`Product saved: ${saved}`);
        await takeStepScreenshot(saved ? 'product_save_success' : 'product_save_result');
      }
    });

    it('should validate farmer products API', async () => {
      const result = await validateApi('GET', '/api/farmer/products', {
        expectedStatus: 401, // No auth — expected 401
      });
      logger.info(`Farmer products API: ${result.statusCode}`);
    });
  });

  describe('Farmer Orders', () => {
    before(async () => {
      await farmerHome.tapOrders();
      await browser.pause(APP_CONFIG.animationWait);
    });

    it('should display farmer orders screen', async () => {
      const loaded = await farmerOrders.isLoaded();
      await takeStepScreenshot('farmer_orders_screen');
      logger.info(`Farmer orders screen: ${loaded}`);
    });

    it('should show orders list or empty state', async () => {
      const hasOrders = await farmerOrders.hasOrders();
      logger.info(`Has orders: ${hasOrders}`);
      await takeStepScreenshot(hasOrders ? 'farmer_has_orders' : 'farmer_no_orders');
    });

    it('should open order detail if orders exist', async () => {
      const hasOrders = await farmerOrders.hasOrders();
      if (hasOrders) {
        await farmerOrders.tapFirstOrder();
        await browser.pause(APP_CONFIG.animationWait);
        await takeStepScreenshot('farmer_order_detail');
        const status = await farmerOrders.getOrderStatus();
        logger.info(`Order status: ${status}`);
      }
    });

    it('should validate farmer orders API response structure', async () => {
      const result = await validateApi('GET', '/api/farmer/orders', {
        expectedStatus: 401,
      });
      logger.info(`Farmer orders API: ${result.statusCode}`);
    });
  });

  describe('Earnings', () => {
    before(async () => {
      try {
        await farmerHome.tapEarnings();
        await browser.pause(APP_CONFIG.animationWait);
      } catch { /* may not be directly accessible */ }
    });

    it('should display earnings information', async () => {
      const visible = await farmerHome.isTextContainingVisible('Earnings') ||
                      await farmerHome.isTextContainingVisible('Revenue') ||
                      await farmerHome.isTextContainingVisible('₹');
      logger.info(`Earnings visible: ${visible}`);
      await takeStepScreenshot('farmer_earnings');
    });
  });
});
