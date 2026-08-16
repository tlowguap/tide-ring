# Responsive Phone and iPad Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Tide Ring responsive and touch-friendly on phone and iPad viewports while preserving the existing desktop layout and audio behavior.

**Architecture:** Keep the application as a dependency-free static site at runtime and implement the layout CSS-first inside `index.html`. Add Playwright only as a development dependency so real browser geometry can enforce the approved viewport behavior, then bump the service-worker cache name so existing installations receive the responsive page.

**Tech Stack:** HTML5, CSS media queries, vanilla JavaScript, Node.js 22, Playwright Test, GitHub Pages

## Global Constraints

- Verify 390 × 844, 430 × 932, 768 × 1024, and 1024 × 768 viewports.
- Keep the seven ambience sliders in one horizontal row on phones.
- Phone ambience sliders must scroll horizontally with scroll snapping.
- All seven ambience sliders must fit without console scrolling on iPad.
- Keep touch targets at least 44 CSS pixels high.
- Do not change audio behavior, application data flow, or the desktop layout above 900 CSS pixels.
- Preserve installability and offline behavior.

---

### Task 1: Responsive Browser Regression Harness and Layout

**Files:**
- Create: `package.json`
- Create: `package-lock.json` via `npm install`
- Create: `playwright.config.js`
- Create: `tests/responsive.spec.js`
- Modify: `index.html:17-120`

**Interfaces:**
- Consumes: the existing static site served from the repository root.
- Produces: `npm test`, which launches the site and validates real layout geometry in Chromium; responsive CSS at phone and tablet breakpoints.

- [ ] **Step 1: Add the browser-test package and configuration**

Create `package.json`:

```json
{
  "name": "tide-ring",
  "private": true,
  "scripts": {
    "test": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0"
  }
}
```

Run:

```bash
npm install
```

Create `playwright.config.js`:

```js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    channel: 'chrome',
  },
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 2: Write the failing viewport tests**

Create `tests/responsive.spec.js`:

```js
const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'phone', width: 390, height: 844, consoleScrolls: true },
  { name: 'large phone', width: 430, height: 932, consoleScrolls: true },
  { name: 'iPad portrait', width: 768, height: 1024, consoleScrolls: false },
  { name: 'iPad landscape', width: 1024, height: 768, consoleScrolls: false },
];

for (const viewport of viewports) {
  test(`${viewport.name} layout stays usable`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    const geometry = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect();
      const stage = rect('.stage');
      const consoleEl = document.querySelector('.console');
      const strips = [...document.querySelectorAll('.strip')].map(el => rect(`#${el.id}`));
      const controls = [...document.querySelectorAll('header > *')].map(el => el.getBoundingClientRect());
      const gongs = [...document.querySelectorAll('.gong')].map(el => el.getBoundingClientRect());
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
      };
    });

    expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(Math.abs(geometry.stage.width - geometry.stage.height)).toBeLessThanOrEqual(1);
    expect(geometry.stage.left).toBeGreaterThanOrEqual(0);
    expect(geometry.stage.right).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(new Set(geometry.stripTops).size).toBe(1);
    expect(geometry.controls.every(item => item.left >= 0 && item.right <= geometry.viewportWidth)).toBe(true);
    expect(geometry.gongHeights.every(height => height >= 44)).toBe(true);

    if (viewport.consoleScrolls) {
      expect(geometry.consoleScrollWidth).toBeGreaterThan(geometry.consoleClientWidth);
      expect(geometry.scrollSnapAlign).toBe('start');
    } else {
      expect(geometry.consoleScrollWidth).toBeLessThanOrEqual(geometry.consoleClientWidth + 1);
    }
  });
}
```

- [ ] **Step 3: Run the tests and verify the responsive requirement fails**

Run:

```bash
npm test
```

Expected: phone cases FAIL because `.strip` has `scroll-snap-align: none` and current header/gong sizing does not satisfy all narrow-layout assertions. Confirm iPad results separately rather than treating an environment or server error as the expected failure.

- [ ] **Step 4: Implement the minimal responsive CSS**

In `index.html`, make body safe-area aware while retaining the current fluid desktop padding:

```css
body{
  padding-top:0;
  padding-right:max(clamp(10px,2.2vw,28px),env(safe-area-inset-right));
  padding-bottom:calc(24px + env(safe-area-inset-bottom));
  padding-left:max(clamp(10px,2.2vw,28px),env(safe-area-inset-left));
}
```

Add tablet and phone rules after the existing component styles:

```css
@media (max-width:900px){
  header{gap:8px}
  .stage{width:min(100%,58vh,560px)}
  .console{gap:8px}
  .strip{min-width:0}
  .col{width:48px}
}

@media (max-width:600px){
  body{padding-bottom:calc(16px + env(safe-area-inset-bottom))}
  header{padding-top:8px;align-items:stretch}
  .brand{flex:1 1 calc(100% - 112px);min-width:190px}
  .tuning{align-self:center;padding:7px 10px}
  .chipbox{flex:1 1 calc(50% - 4px);justify-content:space-between;min-width:0;min-height:44px;padding:5px 10px}
  .chipbox input[type=range]{width:clamp(72px,24vw,104px)}
  .seg{flex:1 1 auto;justify-content:center}
  .seg button{min-height:44px;padding:8px 10px}
  .stage{width:min(100%,55vh,430px)}
  .strikes{flex-wrap:nowrap;gap:6px}
  .gong{flex:1 1 0;min-width:0;min-height:48px;padding:8px 5px;flex-direction:column;align-items:center;justify-content:center;gap:1px}
  .gong .t{font-size:14px}
  .gong .h{font-size:9px}
  .slots{grid-template-columns:1fr}
  .console{gap:6px;padding:12px 10px;scroll-snap-type:x proximity;scroll-padding-inline:10px;-webkit-overflow-scrolling:touch;box-shadow:inset -18px 0 18px -18px rgba(39,101,121,.4),var(--shadow)}
  .strip{flex:0 0 72px;min-width:72px;scroll-snap-align:start}
  .col{width:50px;height:clamp(124px,21vh,170px)}
  .hint{font-size:11px;line-height:1.55}
}
```

Adjust only values required by the failing geometry assertions. Do not add JavaScript layout branches.

- [ ] **Step 5: Run the viewport tests and verify they pass**

Run:

```bash
npm test
```

Expected: 4 tests pass with no page-level overflow, phone console scrolling enabled, and iPad console scrolling absent.

- [ ] **Step 6: Commit the tested responsive layout**

```bash
git add package.json package-lock.json playwright.config.js tests/responsive.spec.js index.html
git commit -m "Make Tide Ring responsive on phones and iPads"
```

---

### Task 2: Offline Cache Refresh and Visual Verification

**Files:**
- Create: `tests/service-worker.test.js`
- Modify: `package.json`
- Modify: `sw.js:4`

**Interfaces:**
- Consumes: the responsive `index.html` from Task 1 and existing service-worker registration.
- Produces: cache version `tide-ring-v2`, an automated cache-version regression check, and verified responsive screenshots.

- [ ] **Step 1: Add the failing cache refresh test**

Create `tests/service-worker.test.js`:

```js
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test('service worker cache is refreshed for responsive release', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  expect(source).toContain("const CACHE = 'tide-ring-v2'");
});
```

- [ ] **Step 2: Run the cache test and verify it fails**

Run:

```bash
npx playwright test tests/service-worker.test.js
```

Expected: FAIL because `sw.js` still contains `tide-ring-v1`.

- [ ] **Step 3: Bump the service-worker cache version**

Change the cache constant in `sw.js`:

```js
const CACHE = 'tide-ring-v2';
```

- [ ] **Step 4: Run the full suite and verify it passes**

Run:

```bash
npm test
```

Expected: 5 tests pass with zero failures.

- [ ] **Step 5: Visually verify responsive rendering**

Open the local site in a real browser at 390 × 844, 430 × 932, 768 × 1024, 1024 × 768, and a desktop width of 1280 × 800. Confirm the bowl labels are legible, header controls do not overlap, gongs remain one row at supported phone widths, the console is visibly scrollable on phones, and the desktop layout is unchanged.

- [ ] **Step 6: Commit the cache refresh**

```bash
git add sw.js tests/service-worker.test.js
git commit -m "Refresh offline cache for responsive release"
```

---

### Task 3: Push and Verify GitHub Pages

**Files:**
- No source files should change.

**Interfaces:**
- Consumes: the verified commits from Tasks 1 and 2.
- Produces: an updated public GitHub Pages deployment at `https://tlowguap.github.io/tide-ring/`.

- [ ] **Step 1: Run final local verification**

```bash
npm test
git diff --check
git status --short --branch
```

Expected: 5 tests pass, `git diff --check` emits nothing, and the branch is clean and ahead of `origin/main` only by the planned commits.

- [ ] **Step 2: Push the commits**

```bash
git push origin main
```

- [ ] **Step 3: Verify deployment state**

```bash
gh api repos/tlowguap/tide-ring/pages --jq '{html_url:.html_url,status:.status,public:.public,https_enforced:.https_enforced}'
```

Expected: `status` becomes `built`, `public` is `true`, and `https_enforced` is `true`.

- [ ] **Step 4: Verify the public release**

Load `https://tlowguap.github.io/tide-ring/` at the four target viewport sizes and repeat the geometry assertions against the deployed origin. Confirm the live `sw.js` contains `tide-ring-v2` and local `HEAD` equals `origin/main`.
