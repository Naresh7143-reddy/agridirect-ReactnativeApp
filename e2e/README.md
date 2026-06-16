# AgriDirect — Appium / WebdriverIO E2E Tests

Selenium-protocol UI automation for the AgriDirect Android APK.

## What this is
- **Appium** = WebDriver server that drives the installed APK on a real phone (or BlueStacks).
- **WebdriverIO** = Node.js client — the same `$()`, `click()`, `setValue()` API you know from Selenium.
- **Mocha** = test runner (`describe` / `it` blocks).

## One-time setup (5 minutes)

```bash
# 1. Install Java 17+ (you already have it) and Android SDK platform-tools

# 2. Install Appium and the Android driver globally
npm install -g appium
appium driver install uiautomator2

# 3. Install WebdriverIO + Mocha in the project
cd C:\Users\nares\Downloads\AgriDirect
npm install --save-dev @wdio/cli @wdio/local-runner @wdio/mocha-framework @wdio/spec-reporter webdriverio mocha
```

## Each test run

1. **Start the Appium server** in a terminal:
   ```bash
   appium
   ```
   Leave it running. You should see `Appium REST http interface listener started on http://0.0.0.0:4723`.

2. **Plug your phone in** (USB debugging ON) — or open BlueStacks.

3. **Verify ADB sees the device**:
   ```bash
   adb devices
   ```
   You should see `AIOZVCNFJ7RCK7ZT  device` (or your device id).

4. **Make sure AgriDirect is installed** on the device:
   ```bash
   adb install -r android/app/build/outputs/apk/release/app-release.apk
   ```

5. **Run the tests** in another terminal:
   ```bash
   npx wdio run e2e/wdio.conf.js
   ```

## What the tests cover

| Spec file | Scenario | Steps |
|---|---|---|
| `01_login.spec.js` | Login with test number | Open app → enter `8919012622` → tap Send OTP → enter `123456` → reach home |
| `02_navigation.spec.js` | All bottom tabs | Home → Orders → Profile → AI (no crashes) |
| `03_order_flow.spec.js` | Buyer places order | Tap product → Add to Cart → verify no NaN → Checkout → see GPS option |

## Adding your own test

Drop a `XX_something.spec.js` file in `e2e/specs/`:

```javascript
describe('My new test', () => {
  it('does something', async () => {
    const btn = await $('//*[contains(@text,"My Button")]');
    await btn.click();
    expect(await $('~MyResult').isDisplayed()).toBe(true);
  });
});
```

## Tips

- **Element selectors**: prefer `//*[contains(@text,"...")]` for buttons with visible labels. For React Native, accessibility labels appear as `text` or `content-desc` in the Android view hierarchy.
- **Debug an element you can't find**: use Appium Inspector (`appium-inspector`) to point-and-click and copy the XPath.
- **Slow renders**: bump the `pause()` calls — React Native release builds can take a beat to mount screens, especially after a cold start.
- **Stuck on the splash screen**: Increase `waitforTimeout` in `wdio.conf.js`, or run a debug build (`react-native run-android`) which mounts faster.

## Troubleshooting

| Error | Fix |
|---|---|
| `cannot find chromedriver` | Not needed — this is a NATIVE app test, not web |
| `An unknown server-side error occurred while processing the command` | Restart Appium; usually means the device disconnected |
| `Element not found` | Open Appium Inspector and copy the actual XPath shown |
| `Cannot find module @wdio/cli` | Re-run `npm install --save-dev @wdio/cli @wdio/local-runner ...` |
