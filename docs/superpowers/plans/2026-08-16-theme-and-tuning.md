# Theme and Tuning Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent device-aware light/dark mode and live A=432/A=528 tuning controls, including smooth retuning of active pitched audio and recorded samples.

**Architecture:** Add a small synchronous `settings.js` module that owns persisted theme and reference-pitch state before the page paints. Keep audio integration in the existing `index.html`, replacing fixed 432 Hz constants with derived functions and rebuilding only active pitched voices when tuning changes.

**Tech Stack:** Static HTML/CSS/JavaScript, Web Audio API, localStorage, matchMedia, Playwright Test, GitHub Pages

## Global Constraints

- Theme follows `prefers-color-scheme` until the user manually toggles it, then remembers the override.
- Tuning options are exactly `A = 432 Hz` and `A = 528 Hz`, with equal-tempered C–B bowl notes.
- All synthesized pitched material derives from the selected reference pitch.
- All built-in and user-loaded samples use playback-rate ratio `selectedReference / 432`.
- Tuning changes preserve session clock, octave, levels, master volume, latch state, and loaded recordings.
- Active pitched ambience and held bowls fade and restart; existing one-shot gongs finish naturally.
- Ocean and rain remain unchanged during tuning changes.
- Phone and coarse-pointer controls remain at least 44 CSS pixels high; no page overflow at existing target viewports.
- Fine-pointer desktop layout remains unchanged.
- Safari/iPad speaker debugging is excluded.
- Offline cache advances to `tide-ring-v4` and includes `settings.js`.

---

### Task 1: Persistent Settings Module and Theme Toggle

**Files:**
- Create: `settings.js`
- Create: `tests/settings.spec.js`
- Modify: `index.html`

**Interfaces:**
- Produces: `window.TideRingSettings` with `state`, `toggleTheme()`, `setReferencePitch(value)`, `noteFrequency(semitones, referencePitch?)`, `sampleRate(referencePitch?)`, and `subscribe(listener)`.
- Consumes: localStorage keys `tide-ring-theme` and `tide-ring-tuning`; `matchMedia('(prefers-color-scheme: dark)')`.

- [ ] **Step 1: Write failing theme tests**

Create `tests/settings.spec.js` with real-page tests that:

```js
const { test, expect } = require('@playwright/test');

test('follows device dark mode until manually overridden', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#themeToggle')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => localStorage.getItem('tide-ring-theme'))).toBe('light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await context.close();
});

test('updates with device theme while no override exists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npx playwright test tests/settings.spec.js`

Expected: FAIL because `#themeToggle`, `settings.js`, and `data-theme` do not exist.

- [ ] **Step 3: Implement settings and dark palette**

Create `settings.js` as a synchronous IIFE. It must safely read/write storage, apply `data-theme` and the active meta theme color, track manual override, and notify subscribers:

```js
(() => {
  const THEME_KEY = 'tide-ring-theme';
  const TUNING_KEY = 'tide-ring-tuning';
  const media = matchMedia('(prefers-color-scheme: dark)');
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const savedTheme = read(THEME_KEY);
  const savedPitch = Number(read(TUNING_KEY));
  const state = {
    themeOverride: ['light', 'dark'].includes(savedTheme) ? savedTheme : null,
    theme: ['light', 'dark'].includes(savedTheme) ? savedTheme : media.matches ? 'dark' : 'light',
    referencePitch: [432, 528].includes(savedPitch) ? savedPitch : 432,
  };
  const listeners = new Set();
  const applyTheme = () => {
    document.documentElement.dataset.theme = state.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', state.theme === 'dark' ? '#071C24' : '#E6F3F8');
  };
  const notify = change => listeners.forEach(listener => listener(change, state));
  const api = {
    state,
    toggleTheme() {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      state.themeOverride = state.theme;
      write(THEME_KEY, state.theme);
      applyTheme(); notify('theme');
    },
    setReferencePitch(value) {
      const pitch = Number(value);
      if (![432, 528].includes(pitch) || pitch === state.referencePitch) return;
      state.referencePitch = pitch; write(TUNING_KEY, String(pitch)); notify('tuning');
    },
    noteFrequency(semitones, referencePitch = state.referencePitch) { return referencePitch * Math.pow(2, semitones / 12); },
    sampleRate(referencePitch = state.referencePitch) { return referencePitch / 432; },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
  media.addEventListener?.('change', event => {
    if (state.themeOverride) return;
    state.theme = event.matches ? 'dark' : 'light'; applyTheme(); notify('theme');
  });
  window.TideRingSettings = api; applyTheme();
})();
```

Load it synchronously after the theme-color meta tag. Add `#themeToggle`, dark CSS custom properties, accessible state updates, and theme-aware surface variables without changing desktop geometry.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npx playwright test tests/settings.spec.js tests/responsive.spec.js`

Expected: theme tests and all six responsive tests pass.

- [ ] **Step 5: Commit**

```bash
git add settings.js index.html tests/settings.spec.js
git commit -m "Add persistent light and dark themes"
```

---

### Task 2: A=432/A=528 Tuning Model and Controls

**Files:**
- Create: `tests/tuning.spec.js`
- Modify: `index.html`
- Modify: `settings.js`

**Interfaces:**
- Consumes: `TideRingSettings.noteFrequency()`, `.sampleRate()`, `.setReferencePitch()`.
- Produces: `#tuningSelect`; dynamic bowl and gong labels; dynamic constructors for bowls, chimes, bells, drone, theta, gongs, and sample playback.

- [ ] **Step 1: Write failing tuning calculations and UI tests**

Create `tests/tuning.spec.js`:

```js
const { test, expect } = require('@playwright/test');

test('switches all displayed tuning values between A432 and A528', async ({ page }) => {
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
```

Add a persistence test that reloads after selecting 528 and expects the dropdown and labels to remain at 528.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx playwright test tests/tuning.spec.js`

Expected: FAIL because `#tuningSelect` does not exist and fixed 432 constants remain.

- [ ] **Step 3: Implement dynamic tuning**

Replace the static tuning badge with a labeled select. Replace fixed `A432`, `NOTES`, `A2`, `A3`, and `PENTA` values with functions derived from settings. Store bowl semitone offsets and gong ratios instead of fixed frequencies:

```js
const Settings = window.TideRingSettings;
const semi = n => Settings.noteFrequency(n);
const a2 = () => Settings.state.referencePitch / 4;
const a3 = () => Settings.state.referencePitch / 2;
const penta = () => [0,2,5,7,9,12,14].map(semi);
const BOWLS = [
  {id:'root', name:'Root', note:'C', semitones:-9, tint:'#3F92AC'},
  {id:'sacral', name:'Sacral', note:'D', semitones:-7, tint:'#4E9DB6'},
  {id:'solar', name:'Solar', note:'E', semitones:-5, tint:'#5DA8BF'},
  {id:'heart', name:'Heart', note:'F', semitones:-4, tint:'#6FB4C9'},
  {id:'throat', name:'Throat', note:'G', semitones:-2, tint:'#84C0D3'},
  {id:'brow', name:'Third eye', note:'A', semitones:0, tint:'#9BCDDC'},
  {id:'crown', name:'Crown', note:'B', semitones:2, tint:'#B4DAE5'},
];
const freqOf = bowl => semi(bowl.semitones) * Math.pow(2, octave);
```

Multiply every sample source playback rate by `Settings.sampleRate()`. Update bowl and gong labels from one `updateTuningUI()` function on load, tuning change, and octave change.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npx playwright test tests/tuning.spec.js tests/settings.spec.js`

Expected: all tuning and settings tests pass.

- [ ] **Step 5: Commit**

```bash
git add index.html settings.js tests/tuning.spec.js
git commit -m "Add selectable 432 and 528 Hz tuning"
```

---

### Task 3: Smooth Live Retuning

**Files:**
- Modify: `tests/tuning.spec.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: layer state `L`, bowl sustain state `B`, settings change notifications, and dynamic voice constructors from Task 2.
- Produces: `retuneActiveAudio()` and deferred retune processing from `unlock()`/`resumeEverything()`.

- [ ] **Step 1: Write failing active-state test**

Extend `tests/tuning.spec.js` to start a drone and held root bowl, change the select, wait for the fade/rebuild window, and assert:

```js
const result = await page.evaluate(async () => {
  ensureAudio(); await ctx.resume();
  setLevel('drone', .4); holdBowl('root', 0.01);
  const oldVoice = L.drone.voice;
  const oldSustain = B.root.sus;
  document.querySelector('#tuningSelect').value = '528';
  document.querySelector('#tuningSelect').dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(resolve => setTimeout(resolve, 1800));
  return {
    level: L.drone.level,
    voiceChanged: L.drone.voice !== oldVoice,
    sustainChanged: B.root.sus !== oldSustain,
    held: Boolean(B.root.sus),
    oceanUntouched: L.ocean.voice === null,
  };
});
expect(result.level).toBeCloseTo(.4, 2);
expect(result.voiceChanged).toBe(true);
expect(result.sustainChanged).toBe(true);
expect(result.held).toBe(true);
expect(result.oceanUntouched).toBe(true);
```

- [ ] **Step 2: Run test and verify RED**

Run: `npx playwright test tests/tuning.spec.js -g 'active'`

Expected: FAIL because active pitched voices are not rebuilt.

- [ ] **Step 3: Implement fade/rebuild behavior**

Track pitched layer IDs in a set. On a tuning notification, capture current active pitched layers and held bowls, fade their gains/sustains, dispose old voices, rebuild after the fade, and restore preserved levels/holds. Use a generation token so rapid tuning changes cancel stale rebuild callbacks. If the context is not running, set `pendingRetune = true` and process it from the next successful `unlock()` or `resumeEverything()`.

Do not stop existing gong buffer sources. Their next strikes read the new sample-rate ratio.

- [ ] **Step 4: Run full suite and verify GREEN**

Run: `npm test`

Expected: settings, tuning, service-worker, and six responsive tests pass without failures.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/tuning.spec.js
git commit -m "Retune active audio without abrupt cuts"
```

---

### Task 4: Offline Release, Visual QA, and Deployment

**Files:**
- Modify: `sw.js`
- Modify: `tests/service-worker.test.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: final `index.html` and `settings.js`.
- Produces: cache `tide-ring-v4`, documented controls, and public GitHub Pages release.

- [ ] **Step 1: Write failing cache test**

Update `tests/service-worker.test.js` to require `tide-ring-v4` and `settings.js` in the precache list.

- [ ] **Step 2: Run cache test and verify RED**

Run: `npx playwright test tests/service-worker.test.js`

Expected: FAIL because `sw.js` is v3 and omits `settings.js`.

- [ ] **Step 3: Update cache and documentation**

Set `const CACHE = 'tide-ring-v4'`, add `settings.js` to `ASSETS`, and document theme/tuning persistence plus the 528 sample-speed tradeoff in `README.md`.

- [ ] **Step 4: Run automated and visual verification**

Run `npm test`. Then capture and inspect light/dark screenshots at 390×844, 768×1024, coarse-pointer 1024×768, and 1280×800. Verify header containment, 44px settings controls, readable text/surfaces, all seven sliders, correct labels, and unchanged fine-pointer desktop geometry.

- [ ] **Step 5: Commit, push, and verify live release**

```bash
git add sw.js tests/service-worker.test.js README.md
git commit -m "Release theme and tuning settings offline"
git push origin main
```

Wait for GitHub Pages `built`, then repeat theme, tuning, viewport, cache-v4, public/HTTPS, clean-tree, and `HEAD == origin/main` checks against `https://tlowguap.github.io/tide-ring/`.
