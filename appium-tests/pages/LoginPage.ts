import { BasePage } from './BasePage';
import { logger } from '../utilities/logger';

export class LoginPage extends BasePage {

  async waitForLoginScreen(): Promise<boolean> {
    return this.waitForTextContaining('AgriDirect', 15000);
  }

  async selectRole(role: 'FARMER' | 'BUYER' | 'DELIVERY'): Promise<void> {
    logger.info(`Selecting role: ${role}`);
    const roleText = { FARMER: 'Farmer', BUYER: 'Buyer', DELIVERY: 'Delivery Partner' }[role];
    const visible = await this.waitForText(roleText, 10000);
    if (!visible) {
      // May be on AuthChoice screen first
      const loginVisible = await this.isTextContainingVisible('Sign In');
      if (loginVisible) await this.tapByTextContaining('Sign In');
      await this.waitForText(roleText, 10000);
    }
    await this.tapByText(roleText);
    await this.sleep(500);
  }

  async enterPhone(phone: string): Promise<void> {
    logger.info(`Entering phone: ${phone}`);
    // React Native TextInput — find by placeholder or hint
    const input = await $('android=new UiSelector().className("android.widget.EditText").instance(0)');
    await input.waitForDisplayed({ timeout: 10000 });
    await input.clearValue();
    await input.setValue(phone);
    await this.hideKeyboard();
  }

  async tapSendOtp(): Promise<void> {
    logger.info('Tapping Send OTP');
    const sent = await this.tapByTextIfExists('Send OTP') ||
                 await this.tapByTextIfExists('Get OTP') ||
                 await this.tapByTextIfExists('Continue');
    if (!sent) await this.tapByTextContaining('OTP');
    await this.sleep(2000);
  }

  private async tapByTextIfExists(text: string): Promise<boolean> {
    try {
      const el = await this.findByText(text);
      const displayed = await el.isDisplayed();
      if (displayed) { await el.click(); return true; }
    } catch { /* ignore */ }
    return false;
  }

  async enterOtp(otp: string): Promise<void> {
    logger.info('Entering OTP');
    await this.sleep(2000);
    // OTP inputs — either individual boxes or a single field
    const inputs = await $$('android=new UiSelector().className("android.widget.EditText")');
    if (inputs.length >= 6) {
      for (let i = 0; i < 6; i++) {
        await inputs[i].setValue(otp[i]);
        await this.sleep(100);
      }
    } else if (inputs.length > 0) {
      await inputs[0].clearValue();
      await inputs[0].setValue(otp);
    }
    await this.hideKeyboard();
  }

  async tapVerifyOtp(): Promise<void> {
    logger.info('Tapping Verify OTP');
    await this.tapByTextIfExists('Verify OTP') ||
    await this.tapByTextIfExists('Verify') ||
    await this.tapByTextIfExists('Confirm');
    await this.sleep(3000);
  }

  async isOnRoleSelection(): Promise<boolean> {
    return (
      await this.isTextVisible('Farmer') &&
      await this.isTextVisible('Buyer')
    );
  }

  async isOnPhoneEntry(): Promise<boolean> {
    try {
      const input = await $('android=new UiSelector().className("android.widget.EditText").instance(0)');
      return input.isDisplayed();
    } catch { return false; }
  }

  async isOnOtpScreen(): Promise<boolean> {
    return this.isTextContainingVisible('OTP') || this.isTextContainingVisible('Verify');
  }

  async isLoginSuccessful(): Promise<boolean> {
    await this.sleep(4000);
    const onHome =
      await this.isTextContainingVisible('Welcome') ||
      await this.isTextContainingVisible('Home') ||
      await this.isTextContainingVisible('Dashboard') ||
      await this.isTextContainingVisible('Good morning') ||
      await this.isTextContainingVisible('Good afternoon') ||
      await this.isTextContainingVisible('Good evening');
    return onHome;
  }
}
