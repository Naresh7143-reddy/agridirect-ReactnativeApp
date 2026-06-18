import { BasePage } from './BasePage';
import { logger } from '../utilities/logger';

export class DeliveryHomePage extends BasePage {

  async isLoaded(): Promise<boolean> {
    return (
      await this.waitForTextContaining('Delivery', 15000) ||
      await this.waitForTextContaining('Available Orders', 15000) ||
      await this.waitForTextContaining('Earnings', 15000)
    );
  }

  async tapAvailableOrders(): Promise<void> {
    logger.info('Tapping available orders');
    try { await this.tapByTextContaining('Available'); } catch { /* ignore */ }
    await this.sleep(1000);
  }

  async claimFirstOrder(): Promise<void> {
    logger.info('Claiming first order');
    try {
      await this.tapByText('Claim') || await this.tapByTextContaining('Accept');
    } catch { /* ignore */ }
    await this.sleep(2000);
  }

  async tapActiveDelivery(): Promise<void> {
    logger.info('Tapping active delivery');
    try { await this.tapByTextContaining('Active'); } catch { /* ignore */ }
    await this.sleep(1000);
  }

  async tapPickedUp(): Promise<void> {
    logger.info('Marking as picked up');
    await this.tapByTextContaining('Picked Up') ||
    await this.tapByTextContaining('Pick Up');
    await this.sleep(2000);
  }

  async tapDelivered(): Promise<void> {
    logger.info('Marking as delivered');
    await this.tapByText('Delivered') || await this.tapByTextContaining('Mark Delivered');
    await this.sleep(2000);
  }

  async getEarningsToday(): Promise<string> {
    try {
      const el = await this.findByText('Today', true);
      const sibling = await el.$('../following-sibling::*[1]');
      return sibling.getText();
    } catch { return '0'; }
  }

  async tapEarnings(): Promise<void> {
    await this.tapByTextContaining('Earnings');
    await this.sleep(1000);
  }

  async tapDeliveries(): Promise<void> {
    await this.tapByText('Deliveries') || await this.tapByText('History');
    await this.sleep(1000);
  }
}
