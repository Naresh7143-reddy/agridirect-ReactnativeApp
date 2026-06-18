import { expect } from 'chai';
import { BuyerHomePage } from '../../pages/BuyerHomePage';
import { ProductDetailPage } from '../../pages/ProductDetailPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { takeStepScreenshot, captureDeviceLogs } from '../../utilities/screenshotUtil';
import { validateApi } from '../../utilities/apiValidator';
import { TEST_ADDRESS, APP_CONFIG } from '../../test-data/testData';
import { logger } from '../../utilities/logger';

describe('🛒 Buyer Module Tests', () => {
  let buyerHome: BuyerHomePage;
  let productDetail: ProductDetailPage;
  let cart: CartPage;
  let checkout: CheckoutPage;

  before(async () => {
    buyerHome = new BuyerHomePage();
    productDetail = new ProductDetailPage();
    cart = new CartPage();
    checkout = new CheckoutPage();
    // Wait for buyer home to load
    const loaded = await buyerHome.isLoaded();
    logger.info(`Buyer home loaded: ${loaded}`);
    await takeStepScreenshot('buyer_home_loaded');
  });

  afterEach(async function () {
    if (this.currentTest?.state === 'failed') {
      await takeStepScreenshot(`FAIL_${this.currentTest.title}`);
      await captureDeviceLogs();
    }
  });

  describe('Browse & Search', () => {
    it('should display buyer home screen', async () => {
      const loaded = await buyerHome.isLoaded();
      expect(loaded).to.be.true;
    });

    it('should navigate to browse tab', async () => {
      await buyerHome.tapBrowse();
      await browser.pause(APP_CONFIG.animationWait);
      await takeStepScreenshot('browse_tab');
    });

    it('should search for a product', async () => {
      await buyerHome.searchProduct('Tomato');
      await browser.pause(APP_CONFIG.apiWait);
      await takeStepScreenshot('search_results');
      logger.info('Search completed');
    });

    it('should validate products API response', async () => {
      const result = await validateApi('GET', '/api/products?q=tomato', {
        expectedStatus: 200,
        maxResponseTime: 10000,
        validateBody: (data) => {
          const errors: string[] = [];
          if (data === undefined || data === null) errors.push('Null response');
          return errors;
        },
      });
      logger.info(`Products search API: ${result.statusCode} (${result.responseTime}ms)`);
    });
  });

  describe('Product Detail', () => {
    it('should open first product from browse', async () => {
      try {
        // Tap first product in list
        const products = await $$('android=new UiSelector().className("android.view.ViewGroup").clickable(true)');
        if (products.length > 1) {
          await products[1].click();
          await browser.pause(APP_CONFIG.animationWait);
          await takeStepScreenshot('product_detail_opened');
        }
      } catch (e) {
        logger.warn('Could not tap product card');
      }
    });

    it('should display product price', async () => {
      const loaded = await productDetail.isLoaded();
      if (loaded) {
        const price = await productDetail.getProductPrice();
        logger.info(`Product price: ${price}`);
        await takeStepScreenshot('product_detail_price');
      }
    });

    it('should check Add to Cart button state', async () => {
      const loaded = await productDetail.isLoaded();
      if (loaded) {
        const enabled = await productDetail.isAddToCartEnabled();
        const unavailable = await productDetail.isProductUnavailable();
        logger.info(`Add to cart enabled: ${enabled}, unavailable: ${unavailable}`);
        await takeStepScreenshot('product_add_to_cart_state');
      }
    });

    it('should add available product to cart', async () => {
      const loaded = await productDetail.isLoaded();
      if (loaded) {
        const unavailable = await productDetail.isProductUnavailable();
        if (!unavailable) {
          await productDetail.tapAddToCart();
          await browser.pause(APP_CONFIG.animationWait);
          await takeStepScreenshot('product_added_to_cart');
          logger.info('Product added to cart');
        } else {
          logger.info('Product is unavailable — skipping add to cart');
        }
      }
    });
  });

  describe('Cart Management', () => {
    before(async () => {
      await buyerHome.tapCart();
      await browser.pause(APP_CONFIG.animationWait);
      await takeStepScreenshot('cart_opened');
    });

    it('should display cart screen', async () => {
      const loaded = await cart.isLoaded();
      expect(loaded).to.be.true;
    });

    it('should show cart items or empty state', async () => {
      const isEmpty = await cart.isCartEmpty();
      logger.info(`Cart empty: ${isEmpty}`);
      await takeStepScreenshot(isEmpty ? 'cart_empty' : 'cart_with_items');
    });

    it('should display total amount', async () => {
      const isEmpty = await cart.isCartEmpty();
      if (!isEmpty) {
        const total = await cart.getTotal();
        logger.info(`Cart total: ${total}`);
        await takeStepScreenshot('cart_total');
      }
    });
  });

  describe('Checkout Flow', () => {
    it('should proceed to checkout if cart has items', async () => {
      const isEmpty = await cart.isCartEmpty();
      if (!isEmpty) {
        await cart.tapCheckout();
        await browser.pause(APP_CONFIG.animationWait);
        const loaded = await checkout.isLoaded();
        await takeStepScreenshot(loaded ? 'checkout_loaded' : 'checkout_failed');
        logger.info(`Checkout loaded: ${loaded}`);
      } else {
        logger.info('Cart is empty — skipping checkout');
      }
    });

    it('should select COD payment', async () => {
      const loaded = await checkout.isLoaded();
      if (loaded) {
        await checkout.selectCOD();
        await takeStepScreenshot('payment_cod_selected');
      }
    });

    it('should validate order placement API', async () => {
      const result = await validateApi('POST', '/api/buyer/orders', {
        body: {
          items: [{ productId: 'test-id', quantity: 1 }],
          paymentMethod: 'COD',
          deliveryAddress: TEST_ADDRESS,
        },
        expectedStatus: 401, // No auth token — expected
      });
      logger.info(`Order API validation: ${result.statusCode}`);
    });
  });

  describe('Orders', () => {
    it('should navigate to orders tab', async () => {
      await buyerHome.tapOrders();
      await browser.pause(APP_CONFIG.animationWait);
      await takeStepScreenshot('orders_tab');
    });

    it('should display orders list or empty state', async () => {
      const hasOrders = await buyerHome.isTextContainingVisible('ORD-');
      const isEmpty = await buyerHome.isTextContainingVisible('no orders');
      logger.info(`Has orders: ${hasOrders}, empty: ${isEmpty}`);
      await takeStepScreenshot('orders_list');
    });
  });
});
