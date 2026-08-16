const { test, expect } = require('@playwright/test');

test('switches displayed values and sample rate between A432 and A528', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#f-root')).toHaveText('257 Hz');
  await expect(page.locator('#f-brow')).toHaveText('432 Hz');
  await page.locator('#tuningSelect').selectOption('528');

  await expect(page.locator('#f-root')).toHaveText('314 Hz');
  await expect(page.locator('#f-brow')).toHaveText('528 Hz');
  await expect(page.locator('#gh-gongDeep')).toHaveText('66 Hz');
  await expect(page.locator('#gh-gongMid')).toHaveText('99 Hz');
  await expect(page.locator('#gh-gongHigh')).toHaveText('132 Hz');

  await page.locator('#octave button[data-o="1"]').click();
  await expect(page.locator('#f-brow')).toHaveText('1056 Hz');
  expect(await page.evaluate(() => TideRingSettings.sampleRate())).toBeCloseTo(528 / 432, 6);
});

test('remembers A528 across reloads', async ({ page }) => {
  await page.goto('/');
  await page.locator('#tuningSelect').selectOption('528');
  expect(await page.evaluate(() => localStorage.getItem('tide-ring-tuning'))).toBe('528');

  await page.reload();
  await expect(page.locator('#tuningSelect')).toHaveValue('528');
  await expect(page.locator('#f-brow')).toHaveText('528 Hz');
});
