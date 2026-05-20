// @ts-check
const { test, expect } = require('@playwright/test');

// Helper: skip se não for projeto orbinutri
function skipIfNotNutri(testInfo) {
  test.skip(!testInfo.project.name.startsWith('orbinutri'),
    'Só executa contra o domínio orbinutri');
}

// ────────────────────────────────────────────────────────
// LANDING PAGE
// ────────────────────────────────────────────────────────
test.describe('Landing OrbiNutri', () => {
  test.beforeEach(async ({}, testInfo) => { skipIfNotNutri(testInfo); });

  test('carrega a landing page com título OrbiNutri', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/orbinutri/i);
    const hero = page.locator('h1, h2').first();
    await expect(hero).toBeVisible();
  });

  test('exibe preço em R$', async ({ page }) => {
    await page.goto('/');
    const priceSection = page.locator('text=/R\\$\\s*\\d+/').first();
    await expect(priceSection).toBeVisible();
  });

  test('CTA principal leva para /login', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /começar|criar conta|teste grátis/i }).first();
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toMatch(/login|register|cadastro/i);
  });

  test('carrega sem erros de JS', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const appErrors = errors.filter(e =>
      !e.includes('extension') && !e.includes('chrome-extension') && !e.includes('favicon')
    );
    expect(appErrors).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────
// REGISTRO via orbinutri.com.br
// ────────────────────────────────────────────────────────
test.describe('Registro via orbinutri.com.br', () => {
  test.beforeEach(async ({}, testInfo) => { skipIfNotNutri(testInfo); });

  test('cria conta via landing e entra no dashboard', async ({ page }) => {
    const email = `viniciuscaracho77+nutri_e2e_${Date.now()}@gmail.com`;

    await page.goto('/login');
    await page.getByRole('button', { name: /crie uma conta/i }).click();
    await expect(page.locator('#reg-name')).toBeVisible();

    await page.locator('#reg-account-name').fill('Consultório E2E');
    await page.locator('#reg-name').fill('Nutricionista E2E');
    await page.locator('#reg-email').fill(email);
    await page.getByTestId('reg-password-input').fill('TestE2E@2026');
    await page.getByTestId('reg-password-confirm-input').fill('TestE2E@2026');

    await page.getByTestId('register-button').click();
    await expect(page).not.toHaveURL(/login/, { timeout: 25_000 });
  });
});
