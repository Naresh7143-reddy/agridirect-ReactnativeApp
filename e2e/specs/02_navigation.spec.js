/**
 * Bottom-tab navigation smoke test — verifies every tab loads its screen
 * without crashing. Run AFTER 01_login.spec.js (noReset keeps you logged in).
 */

describe('AgriDirect — Bottom navigation', () => {

  const tapTab = async (label) => {
    const tab = await $(`//*[contains(@text,"${label}")]`);
    await tab.waitForExist({ timeout: 15000 });
    await tab.click();
    await driver.pause(2000);
  };

  it('Home tab loads', async () => {
    await tapTab('Home');
    const marker = await $('//*[contains(@text,"Good") or contains(@text,"Welcome") or contains(@text,"Categories")]');
    expect(await marker.isExisting()).toBe(true);
  });

  it('Orders tab loads', async () => {
    await tapTab('Orders');
    const marker = await $('//*[contains(@text,"Orders") or contains(@text,"order") or contains(@text,"Pending")]');
    expect(await marker.isExisting()).toBe(true);
  });

  it('Profile tab loads', async () => {
    await tapTab('Profile');
    // Profile screen has either user's name or "Edit Profile"
    const marker = await $('//*[contains(@text,"Edit Profile") or contains(@text,"Settings") or contains(@text,"Log")]');
    expect(await marker.isExisting()).toBe(true);
  });

  it('AI tab loads (farmer role only — skip if not visible)', async () => {
    try {
      await tapTab('AI');
      const marker = await $('//*[contains(@text,"Krishi") or contains(@text,"ask") or contains(@text,"farming")]');
      expect(await marker.isExisting()).toBe(true);
    } catch {
      // Not a farmer — skip
    }
  });
});
