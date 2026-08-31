/**
 * Auth E2E test — sign-up → refresh → sign-out → sign-in
 * Usage: node scripts/e2e-auth.js
 * Requires: npm install --save-dev playwright (done)
 *           Both dev servers running: backend :3000, frontend :8888
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8888';
const TIMEOUT = 15_000;

// Unique test user so repeated runs don't collide
const ts = Date.now();
const TEST_USER = {
  name: `Alice E2E ${ts}`,
  email: `alice.e2e.${ts}@example.com`,
  password: 'TestPass123!',
};

function log(msg) {
  const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
  console.log(`[${time}] ${msg}`);
}
const pass = (step) => log(`✅ PASS  ${step}`);
const fail = (step, err) => log(`❌ FAIL  ${step}\n         ${err}`);

async function run() {
  log(`Test user: ${TEST_USER.email}`);

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    slowMo: 300,
  });

  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT);

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    // ── Step 1: open root → redirect to /auth ─────────────────────────────
    log('Step 1: navigate to /');
    await page.goto(BASE_URL);
    await page.waitForURL(/\/auth/, { timeout: TIMEOUT });
    pass('/ redirects to /auth when signed out');

    // ── Step 2: switch to sign-up mode ────────────────────────────────────
    log('Step 2: switch to signup mode');
    await page.goto(`${BASE_URL}/auth?mode=signup`);
    await page.waitForSelector('#auth-signup-name', { timeout: TIMEOUT });
    pass('Signup form visible');

    // ── Step 3: fill sign-up form ─────────────────────────────────────────
    log('Step 3: fill signup form');
    await page.locator('#auth-signup-name').fill(TEST_USER.name);
    await page.locator('#auth-signup-email').fill(TEST_USER.email);
    await page.locator('#auth-signup-password').fill(TEST_USER.password);
    await page.locator('#auth-signup-confirm').fill(TEST_USER.password);
    pass('Form filled');

    // ── Step 4: submit & wait for /diary ──────────────────────────────────
    log('Step 4: submit signup');
    await page.getByRole('button', { name: /create my nook/i }).click();
    await page.waitForURL(/\/diary/, { timeout: TIMEOUT });
    pass('Signup succeeded → redirected to /diary');

    // ── Step 5: hard refresh — session must persist ───────────────────────
    log('Step 5: hard refresh');
    await page.reload({ waitUntil: 'networkidle' });
    const urlAfterRefresh = page.url();
    if (!urlAfterRefresh.includes('/diary')) {
      throw new Error(`After refresh, landed on: ${urlAfterRefresh}`);
    }
    pass('Session persists after hard refresh (still on /diary)');

    // ── Step 6: sign out ──────────────────────────────────────────────────
    log('Step 6: sign out');
    const signOutBtn = page.getByRole('button', { name: /sign out/i });
    try {
      await signOutBtn.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      const expandBtn = page.getByRole('button', { name: /expand profile/i });
      if (await expandBtn.isVisible()) {
        await expandBtn.click();
        await signOutBtn.waitFor({ state: 'visible', timeout: 5000 });
      }
    }
    await signOutBtn.click();
    await page.waitForURL(/\/auth/, { timeout: TIMEOUT });
    pass('Sign out succeeded → redirected to /auth');

    // ── Step 7: sign in again ─────────────────────────────────────────────
    log('Step 7: sign in');
    await page.waitForSelector('#auth-signin-email', { timeout: TIMEOUT });
    await page.locator('#auth-signin-email').fill(TEST_USER.email);
    await page.locator('#auth-signin-password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in to my nook/i }).click();
    await page.waitForURL(/\/diary/, { timeout: TIMEOUT });
    pass('Sign in succeeded → redirected to /diary');

    // ── Summary ───────────────────────────────────────────────────────────
    console.log('\n─────────────────────────────────────────');
    console.log('  ALL STEPS PASSED ✅');
    console.log('─────────────────────────────────────────');
    console.log(`  Test user email : ${TEST_USER.email}`);
    console.log(`  Neon query      : SELECT * FROM "user" WHERE email = '${TEST_USER.email}';`);
    console.log('─────────────────────────────────────────\n');

    if (consoleErrors.length > 0) {
      console.log('⚠️  Console errors during test:');
      consoleErrors.forEach(e => console.log('   ', e));
    }

  } catch (err) {
    fail('Test aborted', err.message ?? err);
    if (consoleErrors.length > 0) {
      console.log('Console errors captured:');
      consoleErrors.forEach(e => console.log('  ', e));
    }
    process.exitCode = 1;
  } finally {
    await page.waitForTimeout(1500);
    await browser.close();
  }
}

run().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
