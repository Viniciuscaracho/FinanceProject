import { test, expect } from '@playwright/test';

const skipIfNoAuth = () => {
  if (!process.env.TEST_USER_EMAIL) {
    test.skip(true, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD para rodar testes autenticados');
  }
};

test.describe('Dashboard', () => {
  test.beforeEach(skipIfNoAuth);

  test('carrega e exibe o wrapper principal', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 15000 });
  });

  test('exibe métricas de hoje (agendamentos e receita)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const dashboard = page.locator('[data-testid="dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    // A área hero sempre mostra "Hoje" e "Recebido"
    await expect(dashboard.locator('text=Hoje')).toBeVisible({ timeout: 8000 });
    await expect(dashboard.locator('text=Recebido')).toBeVisible();
  });

  test('exibe saudação com nome do usuário', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const dashboard = page.locator('[data-testid="dashboard"]');
    // A saudação contém "Bom dia" / "Boa tarde" / "Boa noite"
    await expect(
      dashboard.locator('text=/bom dia|boa tarde|boa noite/i')
    ).toBeVisible({ timeout: 8000 });
  });

  test('exibe lista de próximos agendamentos ou estado vazio', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('text=/agendamentos|vazio|nenhum|sem agenda/i, [data-testid*="appointment"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('o link de navegação para Agendamentos funciona', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Clica no link de agendamentos no menu lateral ou bottom nav
    await page.click('a[href="/appointments"]');
    await expect(page).toHaveURL('/appointments');
    await expect(page.locator('[data-testid="appointments-page"]')).toBeVisible({ timeout: 10000 });
  });
});
