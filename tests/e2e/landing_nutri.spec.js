// @ts-check
const { test, expect } = require('@playwright/test');

// Só roda no projeto 'orbinutri' e 'orbinutri-mobile'
test.skip(({ project }) => !project.name.startsWith('orbinutri'),
  'Landing nutri só executa contra o domínio orbinutri');

test.describe('Landing OrbiNutri', () => {
  test('carrega a landing page em pt-BR', async ({ page }) => {
    await page.goto('/');

    // Título deve mencionar OrbiNutri ou nutricionista
    await expect(page).toHaveTitle(/orbinutri/i);

    // Hero visível
    const hero = page.locator('h1, h2').first();
    await expect(hero).toBeVisible();
  });

  test('seção de preço exibe valor em R$', async ({ page }) => {
    await page.goto('/');

    // Procura qualquer menção de preço na página
    const priceSection = page.locator('text=/R\$\s*\d+/').first();
    await expect(priceSection).toBeVisible();
  });

  test('CTA "Começar agora" ou similar leva para /login', async ({ page }) => {
    await page.goto('/');

    const cta = page.getByRole('link', { name: /começar|criar conta|teste grátis/i }).first();
    await expect(cta).toBeVisible();

    const href = await cta.getAttribute('href');
    expect(href).toMatch(/login|register|cadastro/i);
  });

  test('navegação no header funciona', async ({ page }) => {
    await page.goto('/');

    // Verifica que há links de navegação no header
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link').first()).toBeVisible();
  });

  test('página carrega sem erros de JS no console', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filtra erros conhecidos de extensões de browser ou third-party
    const appErrors = errors.filter(e =>
      !e.includes('extension') && !e.includes('chrome-extension') && !e.includes('favicon')
    );

    expect(appErrors).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────
// REGISTER via orbinutri.com.br
// ────────────────────────────────────────────────────────
test.describe('Registro via orbinutri.com.br', () => {
  test.skip(({ project }) => !project.name.startsWith('orbinutri'),
    'Só executa contra orbinutri');

  test('usuário consegue criar conta pela landing e entrar no dashboard', async ({ page }) => {
    const email = `nutri_e2e_${Date.now()}@gmail.com`;

    await page.goto('/login');

    await page.getByRole('button', { name: /crie uma conta/i }).click();
    await expect(page.locator('#reg-name')).toBeVisible();

    await page.locator('#reg-name').fill('Nutricionista E2E');
    await page.locator('#reg-email').fill(email);
    await page.getByTestId('reg-password-input').fill('TestE2E@2026');
    await page.getByTestId('reg-password-confirm-input').fill('TestE2E@2026');

    await Promise.all([
      page.waitForURL(/\/(dashboard|$)/, { timeout: 15_000 }),
      page.getByTestId('register-button').click(),
    ]);

    await expect(page).not.toHaveURL(/login/);
  });
});
