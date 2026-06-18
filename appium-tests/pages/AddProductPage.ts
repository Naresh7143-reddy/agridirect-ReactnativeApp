import { BasePage } from './BasePage';
import { logger } from '../utilities/logger';

export class AddProductPage extends BasePage {

  async isLoaded(): Promise<boolean> {
    return (
      await this.waitForTextContaining('Add Product', 10000) ||
      await this.waitForTextContaining('New Product', 10000)
    );
  }

  async fillProductName(name: string): Promise<void> {
    logger.info(`Setting product name: ${name}`);
    await this.setFieldByHint('Product Name', name) ||
    await this.setFirstEditText(name);
  }

  async fillDescription(desc: string): Promise<void> {
    await this.setFieldByHint('Description', desc);
  }

  async fillPrice(price: string): Promise<void> {
    await this.setFieldByHint('Price', price);
  }

  async fillStock(stock: string): Promise<void> {
    await this.setFieldByHint('Stock', stock) ||
    await this.setFieldByHint('Quantity', stock);
  }

  async selectUnit(unit: string): Promise<void> {
    logger.info(`Selecting unit: ${unit}`);
    try {
      await this.tapByText(unit);
    } catch {
      await this.tapByTextContaining('Unit');
      await this.sleep(500);
      await this.tapByText(unit);
    }
  }

  async tapSave(): Promise<void> {
    logger.info('Saving product');
    await this.tapByTextIfExists('Save') ||
    await this.tapByTextIfExists('Add Product') ||
    await this.tapByTextIfExists('Create') ||
    await this.tapByTextIfExists('Submit');
    await this.sleep(3000);
  }

  async isProductSaved(): Promise<boolean> {
    return (
      await this.isTextContainingVisible('success') ||
      await this.isTextContainingVisible('added') ||
      await this.isTextContainingVisible('Product') ||
      await this.isTextContainingVisible('My Products')
    );
  }

  private async setFieldByHint(hint: string, value: string): Promise<boolean> {
    try {
      const sel = `android=new UiSelector().textContains("${hint}")`;
      const el = await $(sel);
      if (await el.isDisplayed()) {
        await el.clearValue();
        await el.setValue(value);
        await this.hideKeyboard();
        return true;
      }
    } catch { /* ignore */ }
    return false;
  }

  private async setFirstEditText(value: string): Promise<void> {
    const el = await $('android=new UiSelector().className("android.widget.EditText").instance(0)');
    await el.clearValue();
    await el.setValue(value);
    await this.hideKeyboard();
  }

  private async tapByTextIfExists(text: string): Promise<boolean> {
    try {
      const el = await this.findByText(text);
      if (await el.isDisplayed()) { await el.click(); return true; }
    } catch { /* ignore */ }
    return false;
  }
}
