import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSiteFiles } from '../scripts/build-site.ts';
import { runHealthCheck } from '../src/checks/health-check.ts';
import { site } from './helpers.ts';

const ROOT = new URL('../', import.meta.url);

test('the website\'s generated files are up to date (run npm run build:site)', () => {
  for (const [path, content] of Object.entries(buildSiteFiles())) {
    assert.equal(readFileSync(new URL(path, ROOT), 'utf8'), content, `${path} is out of date`);
  }
});

test('the browser health check gives exactly the same result as the product', async () => {
  const browser = await import(new URL('site/assets/health-core.js', ROOT).href);
  const data = await import(new URL('site/assets/data.js', ROOT).href);
  const pages = [
    { url: 'https://chaiandcrumb.example', html: site('chai-and-crumb.html') },
    { url: 'https://ledgerly.example', html: site('ledgerly.html') },
    { url: 'http://x.example', html: '<title>Plumber in Leeds</title><form><input><input></form>' },
    { url: 'pasted-html', html: '' },
  ];
  for (const p of pages) {
    const a = runHealthCheck(p);
    const b = browser.checkPage(data.RULES, p, a.at);
    assert.deepEqual(b, a);
  }
});
