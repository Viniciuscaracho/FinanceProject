// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const STAGING_FRONT = 'https://orbiproject-front.dzkxmb.easypanel.host';
const ORBINUTRI    = 'https://orbinutri.com.br';
const AUTH_FILE    = path.join(__dirname, '.auth/staging.json');

module.exports = defineConfig({
  testDir: path.join(__dirname, 'e2e'),
  testIgnore: ['**/performance/**', '**/FrontEnd/**', '**/node_modules/**'],
  timeout: 30_000,
  retries: 1,
  reporter: 'list',
  globalSetup: './global.setup.js',

  use: {
    headless: false,
    slowMo: 400,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // ── Testes de AUTH (sem storage state — testam o fluxo de login/registro)
    {
      name: 'auth-orbi',
      testMatch: /auth\.spec\.js/,
      use: { ...devices['Desktop Chrome'], baseURL: STAGING_FRONT },
    },

    // ── Smoke tests autenticados (com storage state)
    {
      name: 'smoke-orbi',
      testMatch: /smoke\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: STAGING_FRONT,
        storageState: AUTH_FILE,
      },
    },

    // ── Interaction tests — fluxos reais de uso (autenticado)
    {
      name: 'interactions-orbi',
      testMatch: /interactions\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: STAGING_FRONT,
        storageState: AUTH_FILE,
      },
    },

    // ── WhatsApp integration tests (autenticado)
    {
      name: 'whatsapp-orbi',
      testMatch: /whatsapp\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: STAGING_FRONT,
        storageState: AUTH_FILE,
      },
    },

    // ── Integration tests — fluxos cruzando features (autenticado)
    {
      name: 'integration-orbi',
      testMatch: /integration\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: STAGING_FRONT,
        storageState: AUTH_FILE,
      },
    },

    // ── OrbiNutri — landing + auth (sem storage state)
    {
      name: 'orbinutri',
      testMatch: /landing_nutri\.spec\.js|auth\.spec\.js/,
      use: { ...devices['Desktop Chrome'], baseURL: ORBINUTRI },
    },
    {
      name: 'orbinutri-mobile',
      testMatch: /landing_nutri\.spec\.js|auth\.spec\.js/,
      use: { ...devices['Pixel 5'], baseURL: ORBINUTRI },
    },
  ],
});
