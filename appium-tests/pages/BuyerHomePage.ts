import { BasePage } from './BasePage';
import { logger } from '../utilities/logger';

export class BuyerHomePage extends BasePage {

  async isLoaded(): Promise<boolean> {
    return (
      await this.waitForTextContaining('Browse', 15000) ||
      await this.waitForTextContaining('Products', 15000) ||
      await this.waitForTextContaining('Home', 15000)
    );
  }

  async tapBrowse(): Promise<void> {
    logger.info('Navigating to Browse');
    try { await this.tapByText('Browse'); } catch { await this.tapByText('Search'); }
    await this.sleep(1000);
  }

  async tapCart(): Promise<void> {
    logger.info('Navigating to Cart');
    await this.tapByText('Cart');
    await this.sleep(1000);
  }

  async tapOrders(): Promise<void> {
    logger.info('Navigating to Orders');
    await this.tapByText('Orders');
    await this.sleep(1000);
  }

  async tapProfile(): Promise<void> {
    logger.info('Navigating to Profile');
    await this.tapByText('Profile');
    await this.sleep(1000);
  }

  async searchProduct(query: string): Promise<void> {
    logger.info(`Searching: ${query}`);
    try {
      const searchInput = await $('android=new UiSelector().textContains("Search")');
      await searchInput.click();
      await this.sleep(500);
      await searchInput.setValue(query);
      await this.hideKeyboard();
    } catch {
      await this.tapByTextContaining('Search');
      await this.sleep(500);
      const input = await $('android=new UiSelector().className("android.widget.EditText").instance(0)');
      await input.setValue(query);
      await this.hideKeyboard();
    }
    await this.sleep(2000);
  }

  async tapProductCard(productName: string): Promise<void> {
    logger.info(`Tapping product: ${productName}`);
    await this.scrollToText(productName);
    await this.tapByTextContaining(productName);
    await this.sleep(1000);
  }

  async isProductListed(productName: string): Promise<boolean> {
    return this.isTextContainingVisible(productName);
  }
}
