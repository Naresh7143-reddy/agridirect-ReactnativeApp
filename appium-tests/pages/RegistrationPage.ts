import { BasePage } from './BasePage';
import { logger } from '../utilities/logger';

export class RegistrationPage extends BasePage {

  async waitForRegistrationScreen(): Promise<boolean> {
    return (
      await this.waitForTextContaining('Register', 15000) ||
      await this.waitForTextContaining('Create', 15000)
    );
  }

  async fillBuyerRegistration(name: string, email?: string): Promise<void> {
    logger.info('Filling buyer registration');
    const inputs = await $$('android=new UiSelector().className("android.widget.EditText")');
    if (inputs.length > 0) { await inputs[0].clearValue(); await inputs[0].setValue(name); }
    if (email && inputs.length > 1) { await inputs[1].clearValue(); await inputs[1].setValue(email); }
    await this.hideKeyboard();
  }

  async fillFarmerRegistration(name: string, farmName: string, location: string, acres: string): Promise<void> {
    logger.info('Filling farmer registration');
    const inputs = await $$('android=new UiSelector().className("android.widget.EditText")');
    const values = [name, farmName, location, acres];
    for (let i = 0; i < Math.min(inputs.length, values.length); i++) {
      await inputs[i].clearValue();
      await inputs[i].setValue(values[i]);
      await this.sleep(200);
    }
    await this.hideKeyboard();
  }

  async fillDeliveryRegistration(name: string, vehicleType: string, licenseNo: string): Promise<void> {
    logger.info('Filling delivery registration');
    const inputs = await $$('android=new UiSelector().className("android.widget.EditText")');
    const values = [name, vehicleType, licenseNo];
    for (let i = 0; i < Math.min(inputs.length, values.length); i++) {
      await inputs[i].clearValue();
      await inputs[i].setValue(values[i]);
      await this.sleep(200);
    }
    await this.hideKeyboard();
  }

  async tapSubmit(): Promise<void> {
    logger.info('Submitting registration');
    await this.tapByTextIfExists('Register') ||
    await this.tapByTextIfExists('Create Account') ||
    await this.tapByTextIfExists('Submit') ||
    await this.tapByTextIfExists('Continue');
    await this.sleep(4000);
  }

  private async tapByTextIfExists(text: string): Promise<boolean> {
    try {
      const el = await this.findByText(text);
      if (await el.isDisplayed()) { await el.click(); return true; }
    } catch { /* ignore */ }
    return false;
  }

  async isRegistrationSuccessful(): Promise<boolean> {
    return (
      await this.isTextContainingVisible('Success') ||
      await this.isTextContainingVisible('Welcome') ||
      await this.isTextContainingVisible('Congratulations')
    );
  }
}
