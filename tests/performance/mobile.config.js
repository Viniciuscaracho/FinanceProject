/**
 * Config para rodar testes mobile com Chrome visível (headed mode).
 * Viewport: 393×851 (Pixel 5 — Chrome).
 *
 * Execute:
 *   cd tests/performance
 *   npx playwright test e2e/mobile-validation.spec.js \
 *     --config=mobile.config.js --reporter=list
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
    slowMo: 80,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
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
      name: 'mobile-chrome',
      // Pixel 5 usa Chromium (compatível com /usr/bin/chromium-browser)
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
      },
    },
  ],

  webServer: {
    command: `cd ${path.join(__dirname, '../../FrontEnd')} && pnpm dev`,
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
