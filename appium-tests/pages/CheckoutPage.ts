import { BasePage } from './BasePage';
import { logger } from '../utilities/logger';

export class CheckoutPage extends BasePage {

  async isLoaded(): Promise<boolean> {
    return (
      await this.waitForTextContaining('Checkout', 10000) ||
      await this.waitForTextContaining('Delivery Address', 10000) ||
      await this.waitForTextContaining('Order Summary', 10000)
    );
  }

  async selectCOD(): Promise<void> {
    logger.info('Selecting Cash on Delivery');
    try {
      await this.tapByText('Cash on Delivery');
    } catch {
      await this.tapByTextContaining('COD');
    }
    await this.sleep(500);
  }

  async selectOnlinePayment(): Promise<void> {
    logger.info('Selecting online payment');
    try {
      await this.tapByTextContaining('Pay Online');
    } catch {
      await this.tapByTextContaining('Razorpay');
    }
    await this.sleep(500);
  }

  async enterDeliveryAddress(address: {line1: string; city: string; state: string; pincode: string}): Promise<void> {
    logger.info('Entering delivery address');
    const inputs = await $$('android=new UiSelector().className("android.widget.EditText")');
    const values = [address.line1, address.city, address.state, address.pincode];
    for (let i = 0; i < Math.min(inputs.length, values.length); i++) {
      await inputs[i].clearValue();
      await inputs[i].setValue(values[i]);
      await this.sleep(200);
    }
    await this.hideKeyboard();
  }

  async tapPlaceOrder(): Promise<void> {
    logger.info('Placing order');
    await this.scrollDown();
    await this.tapByTextContaining('Place Order') ||
    await this.tapByTextContaining('Confirm Order') ||
    await this.tapByTextContaining('Pay');
    await this.sleep(5000); // Allow time for payment/API
  }

  async isOrderPlaced(): Promise<boolean> {
    return (
      await this.isTextContainingVisible('Order Placed') ||
      await this.isTextContainingVisible('Success') ||
      await this.isTextContainingVisible('Confirmed') ||
      await this.isTextContainingVisible('ORD-')
    );
  }

  async getOrderNumber(): Promise<string> {
    try {
      const el = await this.findByText('ORD-', true);
      return el.getText();
    } catch { return ''; }
  }

  async tapAddAddress(): Promise<void> {
    await this.tapByTextContaining('Add Address') ||
    await this.tapByTextContaining('Add New');
    await this.sleep(1000);
  }
}
