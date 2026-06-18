import { BasePage } from './BasePage';
import { logger } from '../utilities/logger';

export class FarmerOrdersPage extends BasePage {

  async isLoaded(): Promise<boolean> {
    return (
      await this.waitForTextContaining('Orders', 10000) ||
      await this.waitForTextContaining('PENDING', 10000)
    );
  }

  async tapFirstOrder(): Promise<void> {
    logger.info('Tapping first order');
    try {
      const orders = await $$('android=new UiSelector().textContains("ORD-")');
      if (orders.length > 0) await orders[0].click();
    } catch {
      await this.tapByTextContaining('ORD-');
    }
    await this.sleep(1000);
  }

  async tapAcceptOrder(): Promise<void> {
    logger.info('Accepting order');
    await this.tapByText('Accept') || await this.tapByTextContaining('Accept Order');
    await this.sleep(2000);
  }

  async tapPackOrder(): Promise<void> {
    logger.info('Marking as packed');
    await this.tapByText('Pack') || await this.tapByTextContaining('Mark as Packed') || await this.tapByTextContaining('Packed');
    await this.sleep(2000);
  }

  async getOrderStatus(): Promise<string> {
    try {
      for (const status of ['PENDING', 'ACCEPTED', 'PACKED', 'IN_TRANSIT', 'DELIVERED']) {
        if (await this.isTextVisible(status)) return status;
      }
    } catch { /* ignore */ }
    return '';
  }

  async hasOrders(): Promise<boolean> {
    return this.isTextContainingVisible('ORD-');
  }

  async filterByStatus(status: string): Promise<void> {
    try { await this.tapByText(status); } catch { /* no filter available */ }
    await this.sleep(1000);
  }
}
