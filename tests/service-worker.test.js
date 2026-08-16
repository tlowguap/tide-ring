const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test('service worker cache is refreshed for responsive release', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  expect(source).toContain("const CACHE = 'tide-ring-v3'");
});
