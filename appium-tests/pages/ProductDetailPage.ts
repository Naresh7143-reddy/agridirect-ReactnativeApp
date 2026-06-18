import { BasePage } from './BasePage';
import { logger } from '../utilities/logger';

export class ProductDetailPage extends BasePage {

  async isLoaded(): Promise<boolean> {
    return (
      await this.waitForTextContaining('Add to Cart', 10000) ||
      await this.waitForTextContaining('₹', 10000)
    );
  }

  async getProductName(): Promise<string> {
    try {
      const el = await $('android=new UiSelector().className("android.widget.TextView").instance(1)');
      return el.getText();
    } catch { return ''; }
  }

  async getProductPrice(): Promise<string> {
    try {
      const el = await this.findByText('₹', true);
      return el.getText();
    } catch { return ''; }
  }

  async tapAddToCart(): Promise<void> {
    logger.info('Adding product to cart');
    await this.tapByTextContaining('Add to Cart');
    await this.sleep(1000);
  }

  async increaseQuantity(times = 1): Promise<void> {
    for (let i = 0; i < times; i++) {
      try {
        await this.tapByText('+');
      } catch {
        await this.tapByTextContaining('increase');
      }
      await this.sleep(300);
    }
  }

  async decreaseQuantity(times = 1): Promise<void> {
    for (let i = 0; i < times; i++) {
      try { await this.tapByText('-'); } catch { /* ignore */ }
      await this.sleep(300);
    }
  }

  async isAddToCartEnabled(): Promise<boolean> {
    try {
      const btn = await this.findByText('Add to Cart');
      return btn.isEnabled();
    } catch {
      return false;
    }
  }

  async isProductUnavailable(): Promise<boolean> {
    return (
      await this.isTextContainingVisible('Unavailable') ||
      await this.isTextContainingVisible('Out of Stock')
    );
  }

  async tapGoToCart(): Promise<void> {
    logger.info('Going to cart');
    await this.tapByTextContaining('Go to Cart') ||
    await this.tapByTextContaining('View Cart') ||
    await this.tapByText('Cart');
    await this.sleep(1000);
  }

  async goBack(): Promise<void> {
    await this.pressBack();
  }
}
