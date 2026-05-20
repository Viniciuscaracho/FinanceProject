// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const STAGING_FRONT = 'https://orbiproject-front.dzkxmb.easypanel.host';
const ORBINUTRI    = 'https://orbinutri.com.br';

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  reporter: 'list',

  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'orbi-staging',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: STAGING_FRONT,
      },
    },
    {
      name: 'orbinutri',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: ORBINUTRI,
      },
    },
    {
      name: 'orbinutri-mobile',
      use: {
        ...devices['Pixel 5'],
        baseURL: ORBINUTRI,
      },
    },
  ],
});
