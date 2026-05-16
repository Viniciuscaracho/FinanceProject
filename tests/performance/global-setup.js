const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'user.json');
module.exports.AUTH_STATE_PATH = AUTH_STATE_PATH;

function loadEnvTest() {
  const envPath = path.join(__dirname, '.env.test');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const val = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
}

module.exports = async function globalSetup() {
  loadEnvTest();

  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.warn(
      '\n⚠️  TEST_USER_EMAIL / TEST_USER_PASSWORD não definidos.' +
      '\n   Testes autenticados serão pulados.' +
      '\n   Copie .env.test.example para .env.test e preencha.\n'
    );
    return;
  }

  fs.mkdirSync(path.join(__dirname, '.auth'), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const base = process.env.BASE_URL || 'http://localhost:5173';
    await page.goto(`${base}/login`);

    await page.waitForSelector('[data-testid="login-page"]', { timeout: 20000 });
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-button"]');

    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 20000 });
    await page.waitForTimeout(1000);

    await page.context().storageState({ path: AUTH_STATE_PATH });
    console.log('✅ Auth state salvo em', AUTH_STATE_PATH);
  } catch (err) {
    console.error('❌ Falha no global-setup (login):', err.message);
    // Salva um state vazio para não quebrar os projetos que usam storageState
    fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify({ cookies: [], origins: [] }));
  } finally {
    await browser.close();
  }
};
