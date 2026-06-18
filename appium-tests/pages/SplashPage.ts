import { BasePage } from './BasePage';
import { APP_CONFIG } from '../test-data/testData';

export class SplashPage extends BasePage {
  async waitForSplash(): Promise<void> {
    await this.sleep(APP_CONFIG.splashWait);
  }

  async isLoaded(): Promise<boolean> {
    await this.sleep(APP_CONFIG.splashWait);
    return true;
  }
}
