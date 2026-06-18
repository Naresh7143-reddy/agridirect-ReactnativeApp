import { BasePage } from './BasePage';
import { logger } from '../utilities/logger';

export class FarmerHomePage extends BasePage {

  async isLoaded(): Promise<boolean> {
    return (
      await this.waitForTextContaining('Good morning', 15000) ||
      await this.waitForTextContaining('Good afternoon', 15000) ||
      await this.waitForTextContaining('Good evening', 15000) ||
      await this.waitForTextContaining('My Products', 15000)
    );
  }

  async tapAddProduct(): Promise<void> {
    logger.info('Tapping Add Product');
    try {
      await this.tapByText('Add Product');
    } catch {
      // Try the FAB (+) button
      const fab = await $('android=new UiSelector().description("Add Product")');
      await fab.click();
    }
    await this.sleep(1000);
  }

  async tapOrders(): Promise<void> {
    logger.info('Tapping Orders tab');
    await this.tapByText('Orders');
    await this.sleep(1000);
  }

  async tapAI(): Promise<void> {
    logger.info('Tapping AI tab');
    await this.tapByText('AI');
    await this.sleep(1000);
  }

  async tapProfile(): Promise<void> {
    logger.info('Tapping Profile tab');
    await this.tapByText('Profile');
    await this.sleep(1000);
  }

  async tapEarnings(): Promise<void> {
    logger.info('Tapping Earnings');
    await this.tapByTextContaining('Earnings');
    await this.sleep(1000);
  }

  async tapMyProducts(): Promise<void> {
    await this.tapByTextContaining('My Products');
    await this.sleep(1000);
  }

  async getDashboardRevenue(): Promise<string> {
    try {
      const el = await this.findByText('₹', true);
      return (await el.getText()) || '0';
    } catch { return '0'; }
  }

  async isProductVisible(productName: string): Promise<boolean> {
    return this.isTextContainingVisible(productName);
  }
}
