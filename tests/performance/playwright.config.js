const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  globalSetup: require.resolve('./global-setup.js'),

  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Testes públicos/auth — sem storageState
    {
      name: 'public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/auth.spec.js', '**/public.spec.js'],
    },

    // Testes autenticados — reutilizam o storageState do global-setup
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE_PATH,
      },
      testMatch: [
        '**/dashboard.spec.js',
        '**/appointments.e2e.spec.js',
        '**/appointments-modal.spec.js',
        '**/navigation.spec.js',
        '**/professionals.spec.js',
        '**/services.spec.js',
        '**/transactions.spec.js',
        '**/contacts.spec.js',
        '**/appointment-links.spec.js',
        '**/imports.spec.js',
        '**/appointment-notes.spec.js',
        '**/subscription-pix.spec.js',
        '**/meal-plan.spec.js',
      ],
    },

    // Mobile autenticado
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        storageState: AUTH_STATE_PATH,
      },
      testMatch: ['**/dashboard.spec.js', '**/navigation.spec.js'],
    },

    // Performance
    {
      name: 'performance',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/*.performance.spec.js',
    },

    // UI Tour — screenshots de todas as telas (faz login inline)
    {
      name: 'ui-tour',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      testMatch: '**/ui-tour.spec.js',
    },

    // UI Tour Interactive — modals, tabs, estados de click
    {
      name: 'ui-tour-interactive',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      testMatch: ['**/ui-tour-interactive.spec.js', '**/ui-interactive-batch*.spec.js'],
    },

    // UX Audit — auditoria completa de UX e performance (todas as telas + modais)
    {
      name: 'ux-audit',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
      testMatch: '**/full-ux-audit.spec.js',
    },
  ],

  webServer: {
    command: `cd ${path.join(__dirname, '../../FrontEnd')} && pnpm dev`,
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
