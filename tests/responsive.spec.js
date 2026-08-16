const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'phone', width: 390, height: 844, consoleScrolls: true, hasTouch: true },
  { name: 'large phone', width: 430, height: 932, consoleScrolls: true, hasTouch: true },
  { name: 'iPad portrait', width: 768, height: 1024, consoleScrolls: false, hasTouch: true },
  { name: 'iPad landscape', width: 1024, height: 768, consoleScrolls: false, hasTouch: true },
  { name: '1024px desktop', width: 1024, height: 768, consoleScrolls: false, hasTouch: false },
];

for (const viewport of viewports) {
  test(`${viewport.name} layout stays usable`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.hasTouch,
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.locator('#recsBtn').click();

    const geometry = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect();
      const stage = rect('.stage');
      const consoleEl = document.querySelector('.console');
      const strips = [...document.querySelectorAll('.strip')].map(el => rect(`#${el.id}`));
      const controls = [...document.querySelectorAll('header > *')].map(el => el.getBoundingClientRect());
      const gongs = [...document.querySelectorAll('.gong')].map(el => el.getBoundingClientRect());
      const interactiveHeights = [...document.querySelectorAll('.chipbox input[type=range], .seg button, .strip .cap, .slot label, .slot button.clr')]
        .map(el => el.getBoundingClientRect().height);
      const rangeHeights = [...document.querySelectorAll('.chipbox input[type=range]')]
        .map(el => el.getBoundingClientRect().height);
      const firstStripStyle = getComputedStyle(document.querySelector('.strip'));

      return {
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        stage,
        consoleClientWidth: consoleEl.clientWidth,
        consoleScrollWidth: consoleEl.scrollWidth,
        stripTops: strips.map(item => Math.round(item.top)),
        scrollSnapAlign: firstStripStyle.scrollSnapAlign,
        controls: controls.map(item => ({ left: item.left, right: item.right })),
        gongHeights: gongs.map(item => item.height),
        interactiveHeights,
        rangeHeights,
      };
    });

    expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(Math.abs(geometry.stage.width - geometry.stage.height)).toBeLessThanOrEqual(1);
    expect(geometry.stage.left).toBeGreaterThanOrEqual(0);
    expect(geometry.stage.right).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(new Set(geometry.stripTops).size).toBe(1);
    expect(geometry.controls.every(item => item.left >= 0 && item.right <= geometry.viewportWidth)).toBe(true);
    expect(geometry.gongHeights.every(height => height >= 44)).toBe(true);
    if (viewport.hasTouch) {
      expect(geometry.interactiveHeights.every(height => height >= 44)).toBe(true);
    } else {
      expect(geometry.rangeHeights).toEqual([24, 24]);
      expect(geometry.interactiveHeights.every(height => height < 44)).toBe(true);
    }

    if (viewport.consoleScrolls) {
      expect(geometry.consoleScrollWidth).toBeGreaterThan(geometry.consoleClientWidth);
      expect(geometry.scrollSnapAlign).toBe('start');
    } else {
      expect(geometry.consoleScrollWidth).toBeLessThanOrEqual(geometry.consoleClientWidth + 1);
    }

    await context.close();
  });
}
