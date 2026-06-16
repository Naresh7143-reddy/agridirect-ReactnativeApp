/**
 * Login flow — test phone number 8919012622 + code 123456
 * (configured in Firebase Auth as a test number, so no real SMS sent).
 *
 * Verifies:
 *   - Phone Login screen loads
 *   - OTP can be entered and verified
 *   - User lands on a role-specific home screen
 */

describe('AgriDirect — Login flow', () => {

  it('opens the app and lands on the phone login screen', async () => {
    // Wait for the phone-number input to appear (RN takes a moment to mount)
    await driver.pause(4000);
    const phoneInput = await $('//android.widget.EditText[1]');
    await phoneInput.waitForExist({ timeout: 30000 });
    expect(await phoneInput.isDisplayed()).toBe(true);
  });

  it('enters the Firebase test phone number', async () => {
    const phoneInput = await $('//android.widget.EditText[1]');
    await phoneInput.click();
    await phoneInput.setValue('8919012622');
    await driver.hideKeyboard();
  });

  it('taps Send OTP', async () => {
    // Search by visible text — works regardless of internal RN structure
    const sendBtn = await $('//*[contains(@text,"Send OTP") or contains(@text,"Continue")]');
    await sendBtn.waitForExist({ timeout: 15000 });
    await sendBtn.click();
  });

  it('enters the test OTP code 123456', async () => {
    await driver.pause(3000);   // OTP screen transition
    // Most RN OTP inputs are 6 single-digit boxes. Enter into the first.
    const otpInput = await $('//android.widget.EditText[1]');
    await otpInput.waitForExist({ timeout: 20000 });
    await otpInput.setValue('123456');
    await driver.hideKeyboard();
  });

  it('reaches the home screen after verifying OTP', async () => {
    // The Verify button may auto-fire when 6 digits are entered; if not, tap it
    try {
      const verifyBtn = await $('//*[contains(@text,"Verify")]');
      if (await verifyBtn.isExisting()) await verifyBtn.click();
    } catch {}

    // Wait for any home-screen marker (Buyer, Farmer, Delivery, RoleSelection)
    await driver.pause(8000);
    const anyHomeMarker = await $(
      '//*[contains(@text,"Home") or contains(@text,"Welcome") or contains(@text,"Good") or contains(@text,"Choose your role")]'
    );
    await anyHomeMarker.waitForExist({ timeout: 30000 });
    expect(await anyHomeMarker.isDisplayed()).toBe(true);
  });
});
