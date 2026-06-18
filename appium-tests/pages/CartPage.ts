import { BasePage } from './BasePage';
import { logger } from '../utilities/logger';

export class CartPage extends BasePage {

  async isLoaded(): Promise<boolean> {
    return (
      await this.waitForTextContaining('Cart', 10000) ||
      await this.waitForTextContaining('Checkout', 10000)
    );
  }

  async isCartEmpty(): Promise<boolean> {
    return (
      await this.isTextContainingVisible('empty') ||
      await this.isTextContainingVisible('no items') ||
      await this.isTextContainingVisible('Your cart is empty')
    );
  }

  async getCartItemCount(): Promise<number> {
    try {
      const items = await $$('android=new UiSelector().descriptionContains("cart item")');
      return items.length;
    } catch { return 0; }
  }

  async getTotal(): Promise<string> {
    try {
      const el = await this.findByText('Total', true);
      const parent = await el.$('..'); // parent element
      return parent.getText();
    } catch { return '0'; }
  }

  async tapCheckout(): Promise<void> {
    logger.info('Proceeding to checkout');
    await this.scrollDown();
    await this.tapByTextContaining('Checkout') ||
    await this.tapByTextContaining('Proceed');
    await this.sleep(1500);
  }

  async removeItem(index = 0): Promise<void> {
    logger.info(`Removing cart item at index ${index}`);
    try {
      const removeBtns = await $$('android=new UiSelector().descriptionContains("remove")');
      if (removeBtns[index]) await removeBtns[index].click();
    } catch {
      try { await this.tapByTextContaining('Remove'); } catch { /* ignore */ }
    }
    await this.sleep(1000);
  }

  async clearCart(): Promise<void> {
    logger.info('Clearing cart');
    try { await this.tapByTextContaining('Clear'); } catch { /* ignore */ }
    await this.sleep(1000);
  }

  async updateQuantity(index: number, qty: number): Promise<void> {
    logger.info(`Updating item ${index} quantity to ${qty}`);
    try {
      const plusBtns = await $$('android=new UiSelector().text("+")');
      for (let i = 0; i < qty - 1; i++) {
        await plusBtns[index]?.click();
        await this.sleep(200);
      }
    } catch { /* ignore */ }
  }
}
