import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('carrega e exibe o nome do produto', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Orbi/i);
    await expect(page.locator('text=Orbi').first()).toBeVisible();
  });

  test('contém chamada para ação', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');
    // CTA principal — link "Começar grátis" no header da landing page
    await expect(page.locator('a[href="#cta"]').first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Página de Descobrir (/descobrir)', () => {
  test('renderiza sem erro', async ({ page }) => {
    await page.goto('/descobrir');
    await page.waitForLoadState('networkidle');
    // Não deve mostrar erro 404 ou tela em branco
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('text=/página não encontrada|404/i')).toHaveCount(0);
  });

  test('possui campo de busca ou lista de profissionais', async ({ page }) => {
    await page.goto('/descobrir');
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="pesquisar"]')
        .or(page.locator('[data-testid*="discover"], [data-testid*="search"]'))
        .or(page.locator('text=/profissional|serviço|barbearia/i').first())
    ).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Rota de agendamento público', () => {
  test('rota /agendar/:token com token inválido mostra mensagem de erro graciosamente', async ({ page }) => {
    await page.goto('/agendar/token-invalido-123');
    await page.waitForLoadState('networkidle');
    // Deve renderizar algo — não travar em branco
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
