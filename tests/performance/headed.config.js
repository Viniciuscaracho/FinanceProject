/**
 * Config para rodar testes com Chrome visível (headed mode).
 * Usado para validação visual E2E interativa.
 *
 * Execute:
 *   cd tests/performance
 *   npx playwright test e2e/cenarios-completos.spec.js \
 *     --config=headed.config.js \
 *     --reporter=list
 */
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 120_000,

  globalSetup: require.resolve('./global-setup.js'),

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    headless: false,
    slowMo: 120,
    viewport: { width: 1280, height: 800 },
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    launchOptions: {
      executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },

  projects: [
    {
      name: 'headed-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: `cd ${path.join(__dirname, '../../FrontEnd')} && pnpm dev`,
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
