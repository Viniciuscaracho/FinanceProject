const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://orbiproject-front.dzkxmb.easypanel.host/login');
  await page.waitForLoadState('networkidle');

  // Get all interactive elements
  const buttons = await page.locator('button').all();
  console.log('Buttons:');
  for (const btn of buttons) {
    const text = await btn.textContent();
    const testId = await btn.getAttribute('data-testid');
    console.log(`  - "${text?.trim()}" [data-testid="${testId}"]`);
  }

  const inputs = await page.locator('input').all();
  console.log('Inputs:');
  for (const inp of inputs) {
    const type = await inp.getAttribute('type');
    const testId = await inp.getAttribute('data-testid');
    const placeholder = await inp.getAttribute('placeholder');
    console.log(`  - type="${type}" testid="${testId}" placeholder="${placeholder}"`);
  }

  const links = await page.locator('a').all();
  console.log('Links:');
  for (const link of links) {
    const text = await link.textContent();
    const href = await link.getAttribute('href');
    console.log(`  - "${text?.trim()}" href="${href}"`);
  }

  await browser.close();
})();
