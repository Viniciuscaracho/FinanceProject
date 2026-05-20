// @ts-check
const { test, expect } = require('@playwright/test');

function skipIfNotNutri(testInfo) {
  test.skip(!testInfo.project.name.startsWith('orbinutri'),
    'Só executa contra o domínio orbinutri');
}

// Aguarda React hidratar antes de checar conteúdo dinâmico
async function gotoLanding(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

// ────────────────────────────────────────────────────────
// LANDING PAGE
// ────────────────────────────────────────────────────────
test.describe('Landing OrbiNutri', () => {
  test.beforeEach(async ({}, testInfo) => { skipIfNotNutri(testInfo); });

  test('carrega com título OrbiNutri', async ({ page }) => {
    await gotoLanding(page);
    // Título real: "OrbiNutri — Gestão completa para nutricionistas"
    await expect(page).toHaveTitle(/OrbiNutri/i);
  });

  test('hero principal está visível', async ({ page }) => {
    await gotoLanding(page);
    const hero = page.locator('h1').first();
    await expect(hero).toBeVisible();
    const text = await hero.textContent();
    expect(text?.length).toBeGreaterThan(5);
  });

  test('CTA "Começar grátis" aponta para registro', async ({ page }) => {
    await gotoLanding(page);
    // Landing usa "Começar grátis" e "Criar conta grátis" com ?tab=register
    const cta = page.getByRole('link', { name: /começar|criar conta/i }).first();
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toMatch(/login/i);
  });

  test('existe link para /login na página', async ({ page }) => {
    await gotoLanding(page);
    // "Entrar" pode estar no hamburger em mobile; verifica qualquer link para /login
    const loginLinks = page.locator('a[href*="/login"]');
    await expect(loginLinks.first()).toBeAttached();
    const count = await loginLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('carrega sem erros de JS', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(err.message));

    await gotoLanding(page);

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

  test('cria conta via /login e entra no dashboard', async ({ page }) => {
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
