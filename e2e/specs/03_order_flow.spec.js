/**
 * End-to-end order flow — Buyer places an order, verifies cart math.
 * Assumes you're already logged in as a Buyer (run after 01_login.spec.js).
 */

describe('AgriDirect — Place order flow (Buyer)', () => {

  it('opens a product from the home screen', async () => {
    // Tap the first product card (heuristic: contains a ₹ price)
    await driver.pause(2000);
    const product = await $('//*[contains(@text,"₹")]');
    await product.waitForExist({ timeout: 20000 });
    await product.click();
    await driver.pause(2000);
  });

  it('adds the product to cart', async () => {
    const addBtn = await $('//*[contains(@text,"Add to Cart") or contains(@text,"Add")]');
    await addBtn.waitForExist({ timeout: 15000 });
    await addBtn.click();
    await driver.pause(1500);
  });

  it('opens the cart and verifies total is not NaN', async () => {
    const cartIcon = await $('//*[contains(@text,"🛒") or contains(@text,"Cart")]');
    await cartIcon.click();
    await driver.pause(2000);
    // The cart should NOT show "NaN" anywhere — that was the bug we fixed
    const nan = await $('//*[contains(@text,"NaN")]');
    expect(await nan.isExisting()).toBe(false);
    // Should show a ₹ total
    const total = await $('//*[contains(@text,"₹")]');
    expect(await total.isExisting()).toBe(true);
  });

  it('proceeds to checkout', async () => {
    const checkoutBtn = await $('//*[contains(@text,"Checkout") or contains(@text,"Place Order")]');
    await checkoutBtn.waitForExist({ timeout: 15000 });
    await checkoutBtn.click();
    await driver.pause(3000);
  });

  it('shows the address selection screen with GPS option', async () => {
    const gpsBtn = await $('//*[contains(@text,"current location") or contains(@text,"GPS")]');
    expect(await gpsBtn.isExisting()).toBe(true);
  });
});
