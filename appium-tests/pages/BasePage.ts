import { logger } from '../utilities/logger';
import { takeScreenshot } from '../utilities/screenshotUtil';

export class BasePage {
  protected get driver() { return browser; }

  // ── Element finders ───────────────────────────────────────────────────────

  async findByText(text: string, partial = false) {
    const sel = partial
      ? `android=new UiSelector().textContains("${text}")`
      : `android=new UiSelector().text("${text}")`;
    return $(sel);
  }

  async findByRes(resourceId: string) {
    return $(`android=new UiSelector().resourceId("com.agridirect:id/${resourceId}")`);
  }

  async findByDesc(desc: string) {
    return $(`android=new UiSelector().description("${desc}")`);
  }

  async findByClass(className: string, index = 0) {
    return $(`android=new UiSelector().className("${className}").instance(${index})`);
  }

  async findByXPath(xpath: string) {
    return $(xpath);
  }

  // ── Waits ─────────────────────────────────────────────────────────────────

  async waitForText(text: string, timeout = 15000): Promise<boolean> {
    try {
      const el = await this.findByText(text);
      await el.waitForDisplayed({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  async waitForTextContaining(text: string, timeout = 15000): Promise<boolean> {
    try {
      const el = await this.findByText(text, true);
      await el.waitForDisplayed({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  async waitForElement(selector: string, timeout = 15000) {
    const el = await $(selector);
    await el.waitForDisplayed({ timeout });
    return el;
  }

  async sleep(ms: number) {
    await browser.pause(ms);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async tapByText(text: string) {
    logger.info(`Tap: "${text}"`);
    const el = await this.findByText(text);
    await el.waitForDisplayed({ timeout: 15000 });
    await el.click();
    await this.sleep(500);
  }

  async tapByTextContaining(text: string) {
    logger.info(`Tap containing: "${text}"`);
    const el = await this.findByText(text, true);
    await el.waitForDisplayed({ timeout: 15000 });
    await el.click();
    await this.sleep(500);
  }

  async typeText(selector: string, text: string) {
    logger.info(`Type "${text}" into ${selector}`);
    const el = await $(selector);
    await el.waitForDisplayed({ timeout: 10000 });
    await el.clearValue();
    await el.setValue(text);
    await this.hideKeyboard();
  }

  async typeIntoFocusedField(text: string) {
    await browser.keys(text.split(''));
    await this.hideKeyboard();
  }

  async hideKeyboard() {
    try { await browser.hideKeyboard(); } catch { /* ignore */ }
  }

  async scrollDown(scrolls = 1) {
    for (let i = 0; i < scrolls; i++) {
      await browser.execute('mobile: scrollGesture', {
        left: 100, top: 300, width: 200, height: 600,
        direction: 'down', percent: 0.75,
      });
      await this.sleep(300);
    }
  }

  async scrollUp(scrolls = 1) {
    for (let i = 0; i < scrolls; i++) {
      await browser.execute('mobile: scrollGesture', {
        left: 100, top: 300, width: 200, height: 600,
        direction: 'up', percent: 0.75,
      });
      await this.sleep(300);
    }
  }

  async scrollToText(text: string) {
    const sel = `android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().textContains("${text}"))`;
    try { await $(sel); } catch { /* may not be scrollable */ }
  }

  async swipeLeft() {
    const { width, height } = await browser.getWindowSize();
    await browser.action('pointer')
      .move({ x: width * 0.8, y: height * 0.5 })
      .down()
      .move({ x: width * 0.2, y: height * 0.5 })
      .up()
      .perform();
  }

  async pressBack() {
    await browser.pressKeyCode(4);
    await this.sleep(500);
  }

  async screenshot(name: string) {
    return takeScreenshot(name);
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async isTextVisible(text: string): Promise<boolean> {
    try {
      const el = await this.findByText(text);
      return el.isDisplayed();
    } catch { return false; }
  }

  async isTextContainingVisible(text: string): Promise<boolean> {
    try {
      const el = await this.findByText(text, true);
      return el.isDisplayed();
    } catch { return false; }
  }

  async getCurrentActivity(): Promise<string> {
    return browser.getCurrentActivity();
  }
}
