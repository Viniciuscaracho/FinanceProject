const { chromium } = require('@playwright/test');

const BASE_URL = 'https://orbiproject-front.dzkxmb.easypanel.host';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('response', r => {
    if (r.url().includes('/api/') && r.status() >= 400)
      console.log('API error:', r.status(), r.url());
  });

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });

  // Dump todos inputs + buttons da tela de login
  const inputs = await page.evaluate(() => {
    return [...document.querySelectorAll('input')].map(el => ({
      type: el.type, id: el.id, name: el.name,
      placeholder: el.placeholder, testid: el.dataset.testid
    }));
  });
  const buttons = await page.evaluate(() => {
    return [...document.querySelectorAll('button')].map(el => ({
      type: el.type, text: el.textContent.trim().slice(0, 40),
      testid: el.dataset.testid
    }));
  });

  console.log('=== INPUTS ===');
  inputs.forEach(i => console.log(JSON.stringify(i)));
  console.log('=== BUTTONS ===');
  buttons.forEach(b => console.log(JSON.stringify(b)));

  await browser.close();
})();
