import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { resolveConfig } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const fallback = '/* /index.html 200\n';
const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the fallback is a public asset with no obsolete root copy', async () => {
  assert.equal(await source('public/_redirects'), fallback);
  await assert.rejects(access(new URL('../_redirects', import.meta.url)), { code: 'ENOENT' });
});

test('Netlify build settings and its nonforced rewrite agree with the public rule', async () => {
  const toml = await source('netlify.toml');
  // Inspect the two delivery sections, not a general-purpose TOML parser.
  const sections = toml.split(/(?=^\[)/m);
  const build = sections.find((section) => section.startsWith('[build]'));
  const redirects = sections.filter((section) => section.startsWith('[[redirects]]'));
  assert.ok(build, 'explicit build settings are required');
  assert.match(build, /^\s*command\s*=\s*"npm run build"\s*(?:#.*)?$/m);
  assert.match(build, /^\s*publish\s*=\s*"dist"\s*(?:#.*)?$/m);
  assert.equal(redirects.length, 1, 'one catchall rewrite should define the contract');
  const rule = redirects[0];
  assert.match(rule, /^\s*from\s*=\s*"\/\*"\s*(?:#.*)?$/m);
  assert.match(rule, /^\s*to\s*=\s*"\/index\.html"\s*(?:#.*)?$/m);
  assert.match(rule, /^\s*status\s*=\s*200\s*(?:#.*)?$/m);
  assert.doesNotMatch(rule, /^\s*force\s*=\s*true\b/m);
  const [from, to, status] = (await source('public/_redirects')).trim().split(/\s+/);
  assert.deepEqual([from, to, Number(status)], ['/*', '/index.html', 200]);
});

test('Vite resolves public copying into the Netlify publish directory without a build', async () => {
  // Disable env-file loading: this contract needs no Supabase values or built artifacts.
  const config = await resolveConfig({ root, envFile: false }, 'build', 'production');
  assert.equal(config.base, '/');
  assert.equal(resolve(config.publicDir), resolve(root, 'public'));
  assert.equal(resolve(root, config.build.outDir), resolve(root, 'dist'));
  assert.equal(config.build.copyPublicDir, true);
});
