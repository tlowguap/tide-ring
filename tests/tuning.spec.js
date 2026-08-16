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

test('retunes active pitched voices without losing their state', async ({ page }) => {
  await page.goto('/');
  await page.locator('#themeToggle').click();
  await page.evaluate(() => {
    setLevel('drone', .4);
    holdBowl('root', .01);
    window.__retuneBefore = {
      voice: L.drone.voice,
      sustain: B.root.sus,
      ocean: L.ocean.voice,
    };
  });

  await page.locator('#tuningSelect').selectOption('528');
  await page.waitForTimeout(1800);

  const result = await page.evaluate(() => ({
    referencePitch: Settings.state.referencePitch,
    level: L.drone.level,
    voiceChanged: L.drone.voice !== window.__retuneBefore.voice,
    sustainChanged: B.root.sus !== window.__retuneBefore.sustain,
    held: Boolean(B.root.sus),
    oceanUntouched: L.ocean.voice === window.__retuneBefore.ocean,
  }));
  expect(result.referencePitch).toBe(528);
  expect(result.level).toBeCloseTo(.4, 2);
  expect(result.voiceChanged).toBe(true);
  expect(result.sustainChanged).toBe(true);
  expect(result.held).toBe(true);
  expect(result.oceanUntouched).toBe(true);
});
