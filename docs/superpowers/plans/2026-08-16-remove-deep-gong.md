# Remove Deep Gong Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Deep gong option from the live app while preserving the recording file for recovery.

**Architecture:** Delete the `gongDeep` entries that feed sample loading and gong rendering, then remove the recording from the offline precache. Existing flex layout behavior handles the remaining two buttons without new CSS.

**Tech Stack:** Static HTML/CSS/JavaScript, Web Audio API, service worker, Playwright.

## Global Constraints

- Keep `audio/deep-gong.mp3` in the repository.
- Do not change Temple gong, Bright gong, bowls, ambience layers, theme, or tuning behavior.
- Bump the offline cache version so installed devices receive the removal.

---

### Task 1: Remove the Deep Gong Runtime Option

**Files:**
- Modify: `tests/tuning.spec.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: the rendered `.gong` controls and `#gh-gongMid` / `#gh-gongHigh` tuning labels.
- Produces: exactly two gong controls named Temple gong and Bright gong.

- [ ] **Step 1: Write the failing browser assertion**

Add a test that loads `/`, collects `.gong .t` labels, and expects the literal array `['Temple gong', 'Bright gong']`.

- [ ] **Step 2: Run the focused test to verify RED**

Run: `npx playwright test tests/tuning.spec.js -g 'two remaining gongs'`

Expected: FAIL because the rendered labels still include `Deep gong`.

- [ ] **Step 3: Remove the runtime entries**

Remove `gongDeep` from `SLOTS`, `BUILTIN_FILES`, and `GONGS` in `index.html`. Update the existing 528 Hz test to assert Temple gong is `99 Hz` and Bright gong is `132 Hz`.

- [ ] **Step 4: Run the focused tuning tests**

Run: `npx playwright test tests/tuning.spec.js`

Expected: all tuning tests pass.

### Task 2: Refresh Offline Delivery and Deploy

**Files:**
- Modify: `tests/service-worker.test.js`
- Modify: `sw.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: hosted `index.html` without Deep gong.
- Produces: a new cache version that omits `audio/deep-gong.mp3` and public documentation listing two recordings.

- [ ] **Step 1: Update the cache test first**

Require `tide-ring-v5` and assert that the parsed service-worker asset list does not include `audio/deep-gong.mp3`.

- [ ] **Step 2: Run the cache test to verify RED**

Run: `npx playwright test tests/service-worker.test.js`

Expected: FAIL because the cache is v4 and still contains the Deep gong recording.

- [ ] **Step 3: Update offline assets and documentation**

Set the cache to `tide-ring-v5`, remove `audio/deep-gong.mp3` from `ASSETS`, and update README wording from three gong recordings to two.

- [ ] **Step 4: Verify and deploy**

Run: `npm test`

Expected: all tests pass. Then verify phone and iPad layout, commit, push `main`, wait for GitHub Pages to build, and confirm the public app has exactly the Temple gong and Bright gong controls.
