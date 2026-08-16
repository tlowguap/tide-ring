const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test('service worker omits the removed Deep gong recording', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  expect(source).toContain("const CACHE = 'tide-ring-v5'");
  expect(source).toContain("'settings.js'");
  expect(source).not.toContain("'audio/deep-gong.mp3'");
});
