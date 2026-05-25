// @ts-check
// Config para rodar testes sem re-autenticar (usa auth state existente em .auth/staging.json)
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const STAGING_FRONT = 'https://orbiproject-front.dzkxmb.easypanel.host';
const ORBINUTRI    = 'https://orbinutri.com.br';
const AUTH_FILE    = path.join(__dirname, '.auth/staging.json');

module.exports = defineConfig({
  testDir: path.join(__dirname, 'e2e'),
  testIgnore: ['**/performance/**', '**/FrontEnd/**', '**/node_modules/**'],
  timeout: 35_000,
  retries: 1,
  workers: 1, // sequencial para evitar conflito de appointments entre projetos
  reporter: 'list',
  // sem globalSetup — usa o auth state salvo

  use: {
    headless: false,
    slowMo: 300,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'smoke-orbi',
      testMatch: /smoke\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: STAGING_FRONT,
        storageState: AUTH_FILE,
      },
    },
    {
      name: 'interactions-orbi',
      testMatch: /interactions\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: STAGING_FRONT,
        storageState: AUTH_FILE,
      },
    },
    {
      name: 'mobile-orbi',
      testMatch: /mobile_responsive\.spec\.js/,
      use: {
        ...devices['Pixel 5'],
        baseURL: STAGING_FRONT,
        storageState: AUTH_FILE,
      },
    },
    {
      name: 'whatsapp-orbi',
      testMatch: /whatsapp\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: STAGING_FRONT,
        storageState: AUTH_FILE,
      },
    },
    {
      name: 'integration-orbi',
      testMatch: /integration\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: STAGING_FRONT,
        storageState: AUTH_FILE,
      },
    },
    {
      name: 'google-integrations',
      testMatch: /google_integrations\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: STAGING_FRONT,
        storageState: AUTH_FILE,
      },
    },
    {
      name: 'mobile-screenshots',
      testMatch: /mobile_screenshots\.spec\.js/,
      use: {
        ...devices['Pixel 5'],
        baseURL: STAGING_FRONT,
        storageState: AUTH_FILE,
      },
    },
    {
      name: 'orbinutri',
      testMatch: /landing_nutri\.spec\.js/,
      use: { ...devices['Desktop Chrome'], baseURL: ORBINUTRI },
    },
  ],
});
