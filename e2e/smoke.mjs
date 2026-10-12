// End-to-end smoke test: builds nothing, serves dist/ through the real API on a
// temporary database and drives the main purchase journey in Chromium.
// Run `npm run build` first (or use `npm run test:e2e` after `npm start` once).
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const port = 3100;
const base = `http://127.0.0.1:${port}`;
const dataDir = mkdtempSync(join(tmpdir(), 'nexora-e2e-'));
const server = spawn(
  process.execPath,
  [
    '--experimental-strip-types',
    '--disable-warning=ExperimentalWarning',
    'server/index.ts',
  ],
  {
    env: {
      ...process.env,
      PORT: String(port),
      DB_PATH: join(dataDir, 'store.db'),
    },
    stdio: 'pipe',
  },
);
const screenshots = process.env.E2E_SCREENSHOTS;
async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${base}/api/health`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('API server did not start');
}
const steps = [];
async function step(name, run) {
  await run();
  steps.push(name);
  console.log(`ok - ${name}`);
}
let browser;
try {
  await waitForServer();
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1448, height: 1086 },
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  const bagCount = () => page.locator('.bag-count').textContent();
  await step('home renders featured products from the API', async () => {
    await page.goto(base);
    await page.getByRole('heading', { name: 'Featured Products' }).waitFor();
    assert.equal(await page.locator('.catalog .product-card').count(), 6);
    assert.equal(await page.title(), 'NEXORA — A brighter everyday');
    if (screenshots)
      await page.screenshot({
        path: join(screenshots, 'spa-home.jpg'),
        quality: 80,
      });
  });
  await step(
    'category link opens /shop with the filter in the URL',
    async () => {
      await page
        .getByRole('navigation', { name: 'Shop by category' })
        .getByRole('link', { name: 'Audio' })
        .click();
      await page.waitForURL(`${base}/shop?category=audio`);
      await page.getByRole('heading', { level: 1, name: 'Audio' }).waitFor();
      assert.equal(await page.locator('.catalog .product-card').count(), 3);
    },
  );
  await step('sorting updates the URL and order', async () => {
    await page.getByLabel('Sort').selectOption('price-asc');
    await page.waitForURL(/sort=price-asc/);
    const prices = await page.locator('.catalog .price').allTextContents();
    const values = prices.map((text) => Number(text.replace(/[^0-9.]/g, '')));
    assert.deepEqual(
      values,
      [...values].sort((a, b) => a - b),
    );
  });
  await step(
    'product page opens by link and Back returns to the filtered shop',
    async () => {
      await page
        .getByRole('link', { name: /NEXORA Flow Pro/ })
        .first()
        .click();
      await page.waitForURL(`${base}/product/flow`);
      await page
        .getByRole('heading', { level: 1, name: 'NEXORA Flow Pro' })
        .waitFor();
      assert.equal(await page.title(), 'NEXORA Flow Pro · NEXORA');
      await page.goBack();
      await page.waitForURL(/\/shop\?category=audio&sort=price-asc/);
      await page.goForward();
      await page
        .getByRole('heading', { level: 1, name: 'NEXORA Flow Pro' })
        .waitFor();
    },
  );
  await step('adding to bag persists across reloads', async () => {
    const add = page.getByRole('button', { name: /Add(ed)? to bag/ });
    await add.click();
    await add.click();
    assert.equal(await bagCount(), '2');
    await page.reload();
    await page
      .getByRole('heading', { level: 1, name: 'NEXORA Flow Pro' })
      .waitFor();
    assert.equal(await bagCount(), '2');
  });
  await step('bag drawer links to the bag page with exact totals', async () => {
    await page.getByRole('button', { name: /Open bag/ }).click();
    await page
      .getByRole('dialog')
      .getByRole('link', { name: 'View full bag' })
      .click();
    await page.waitForURL(`${base}/cart`);
    await page.getByRole('heading', { level: 1, name: 'Your bag' }).waitFor();
    await page
      .locator('dialog[open]')
      .waitFor({ state: 'detached', timeout: 2000 })
      .catch(() => {});
    assert.equal(await page.locator('dialog[open]').count(), 0);
    assert.match(
      await page.locator('.order-summary').textContent(),
      /\$398\.00/,
    );
  });
  await step(
    'checkout validates, then places an order priced by the server',
    async () => {
      await page.getByRole('link', { name: 'Checkout' }).click();
      await page.waitForURL(`${base}/checkout`);
      await page.getByRole('button', { name: 'Place order' }).click();
      await page
        .getByRole('alert')
        .filter({ hasText: 'Please check the highlighted fields.' })
        .waitFor();
      assert.equal(await page.locator('.field-error').count(), 6);
      await page.getByLabel('Full name').fill('Mariia Test');
      await page.getByLabel('Email').fill('mariia@example.com');
      await page.getByLabel('Phone').fill('+380 44 123 4567');
      await page.getByLabel('Street address').fill('1 Khreshchatyk St');
      await page.getByLabel('City').fill('Kyiv');
      await page.getByLabel('Postal code').fill('01001');
      await page.getByText('Express delivery').click();
      assert.match(
        await page.locator('.summary-total').textContent(),
        /\$413\.00/,
      );
      if (screenshots)
        await page.screenshot({
          path: join(screenshots, 'spa-checkout.jpg'),
          quality: 80,
        });
      await page.getByRole('button', { name: 'Place order' }).click();
      await page.waitForURL(/\/order\/NX-[A-Z0-9]{8}$/);
      await page
        .getByRole('heading', { level: 1, name: 'Thank you, Mariia.' })
        .waitFor();
      assert.match(
        await page.locator('.summary-total').textContent(),
        /\$413\.00/,
      );
      assert.equal(await bagCount(), '0');
    },
  );
  await step(
    'order confirmation survives a reload (read from the API)',
    async () => {
      await page.reload();
      await page
        .getByRole('heading', { level: 1, name: 'Thank you, Mariia.' })
        .waitFor();
      if (screenshots)
        await page.screenshot({
          path: join(screenshots, 'spa-order.jpg'),
          quality: 80,
        });
    },
  );
  await step('header search navigates to results', async () => {
    await page.getByLabel('Search products').fill('backpack');
    await page.waitForURL(`${base}/shop?q=backpack`);
    await page
      .getByRole('heading', { level: 1, name: 'Results for “backpack”' })
      .waitFor();
    assert.ok((await page.locator('.catalog .product-card').count()) >= 1);
  });
  await step('favorites appear on /saved and persist', async () => {
    await page
      .getByRole('button', { name: /^Save / })
      .first()
      .click();
    await page.getByRole('link', { name: 'Account, saved collection' }).click();
    await page.waitForURL(`${base}/saved`);
    await page.reload();
    await page.locator('.catalog .product-card').first().waitFor();
    assert.equal(await page.locator('.catalog .product-card').count(), 1);
  });
  await step('info pages and newsletter work', async () => {
    await page
      .getByRole('contentinfo')
      .getByRole('link', { name: 'Sustainability' })
      .click();
    await page
      .getByRole('heading', { level: 1, name: 'Designed to be kept.' })
      .waitFor();
    await page.getByLabel('Join a brighter inbox').fill('hello@example.com');
    await page.getByRole('button', { name: 'Subscribe to newsletter' }).click();
    await page
      .getByText('You’re on the list. A brighter inbox awaits.')
      .waitFor();
  });
  await step('unknown routes and products show not-found pages', async () => {
    await page.goto(`${base}/product/does-not-exist`);
    await page
      .getByRole('heading', {
        level: 1,
        name: 'We couldn’t find that product.',
      })
      .waitFor();
    await page.goto(`${base}/no/such/page`);
    await page
      .getByRole('heading', { level: 1, name: 'This page wandered off.' })
      .waitFor();
  });
  await step('no horizontal overflow at phone and tablet widths', async () => {
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        '/',
        '/shop',
        '/product/flow',
        '/cart',
        '/checkout',
        '/about',
      ]) {
        await page.goto(`${base}${path}`);
        await page.locator('#main h1, #main .hero h1').first().waitFor();
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        assert.equal(
          overflow,
          0,
          `${path} overflows by ${overflow}px at ${width}px`,
        );
      }
    }
    if (screenshots) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${base}/product/flow`);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.screenshot({
        path: join(screenshots, 'spa-product-mobile.jpg'),
        quality: 80,
        fullPage: true,
      });
    }
  });
  await step('no console errors', async () => {
    assert.deepEqual(consoleErrors, []);
  });
  console.log(`\n${steps.length} e2e steps passed`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server.exitCode === null && server.signalCode === null) {
    const stopped = once(server, 'exit');
    server.kill();
    await stopped;
  }
  rmSync(dataDir, { recursive: true, force: true });
}
