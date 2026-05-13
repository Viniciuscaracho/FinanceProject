import { test, expect } from '@playwright/test';

const skipIfNoAuth = () => {
  if (!process.env.TEST_USER_EMAIL) {
    test.skip(true, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD para rodar testes autenticados');
  }
};

test.describe('Agendamentos — visualização', () => {
  test.beforeEach(skipIfNoAuth);

  test('carrega a página e exibe o wrapper principal', async ({ page }) => {
    await page.goto('/appointments');
    await expect(page.locator('[data-testid="appointments-page"]')).toBeVisible({ timeout: 15000 });
  });

  test('exibe o botão "Novo Agendamento"', async ({ page }) => {
    await page.goto('/appointments');
    await expect(page.locator('[data-testid="new-appointment-btn"]')).toBeVisible({ timeout: 10000 });
  });

  test('exibe o título da página', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Agendamentos")')).toBeVisible({ timeout: 10000 });
  });

  test('mostra lista ou calendário de agendamentos', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    // Deve exibir alguma forma de visualização (tabela, calendário ou estado vazio)
    await expect(
      page.locator('[data-testid="appointments-page"]')
        .locator('table, [class*="calendar"], [class*="rbc-"], text=/nenhum|vazio|sem agendamento/i')
        .first()
    ).toBeVisible({ timeout: 12000 });
  });
});

test.describe('Agendamentos — criação', () => {
  test.beforeEach(skipIfNoAuth);

  test('abre o formulário ao clicar em "Novo Agendamento"', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');

    await page.click('[data-testid="new-appointment-btn"]');

    // Aguarda qualquer modal/dialog de formulário aparecer
    await expect(
      page.locator('[role="dialog"]').or(page.locator('[data-testid*="appointment-form"]'))
    ).toBeVisible({ timeout: 8000 });
  });

  test('fecha o formulário ao clicar em Cancelar ou no X', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');

    await page.click('[data-testid="new-appointment-btn"]');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });

    // Fecha pelo botão Cancelar ou pelo X do dialog
    const cancelBtn = dialog.locator('button:has-text(/cancelar/i), button[aria-label*="fechar"], button[aria-label*="close"]').first();
    await cancelBtn.click();

    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Agendamentos — filtros e navegação', () => {
  test.beforeEach(skipIfNoAuth);

  test('botão de atualizar (refresh) está visível e clicável', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');

    // Botão de refresh tem um SVG com RefreshCw
    const refreshBtn = page.locator('[data-testid="appointments-page"] button').filter({
      has: page.locator('svg'),
    }).first();
    await expect(refreshBtn).toBeVisible({ timeout: 8000 });
    await refreshBtn.click();
    // Após clicar não deve quebrar
    await expect(page.locator('[data-testid="appointments-page"]')).toBeVisible();
  });
});
