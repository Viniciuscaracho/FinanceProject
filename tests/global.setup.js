// @ts-check
/**
 * Global setup: faz login uma vez e salva o storage state (localStorage + cookies)
 * para reutilização nos smoke tests sem precisar logar em cada teste.
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const STAGING_FRONT = 'https://orbiproject-front.dzkxmb.easypanel.host';
const LOGIN_EMAIL    = 'viniciuscaracho77@gmail.com';
const LOGIN_PASSWORD = '12345678';

module.exports = async function globalSetup() {
  fs.mkdirSync(path.join(__dirname, '.auth'), { recursive: true });

  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(`${STAGING_FRONT}/login`);
  await page.getByTestId('email-input').fill(LOGIN_EMAIL);
  await page.getByTestId('password-input').fill(LOGIN_PASSWORD);
  await page.getByTestId('login-button').click();
  await page.waitForURL(/\/(dashboard|$)/, { timeout: 20_000 });

  await ctx.storageState({ path: path.join(__dirname, '.auth/staging.json') });
  await browser.close();
  console.log('  ✓ Auth storage state salvo em .auth/staging.json');
};
