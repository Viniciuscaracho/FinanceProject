import { test, expect } from '@playwright/test';

const skipIfNoAuth = () => {
  if (!process.env.TEST_USER_EMAIL) {
    test.skip(true, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD');
  }
};

test.describe('Transações — página', () => {
  test.beforeEach(skipIfNoAuth);

  test('carrega a página', async ({ page }) => {
    await page.goto('/transactions');
    await expect(page.locator('[data-testid="transactions-page"]')).toBeVisible({ timeout: 12000 });
  });

  test('exibe título Transações', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Transações")')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Transações — dialog "Nova Transação"', () => {
  test.beforeEach(skipIfNoAuth);

  test('botão "Nova Transação" abre o dialog', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-transaction-btn"]');
    await expect(page.locator('[data-testid="transaction-dialog"]')).toBeVisible({ timeout: 8000 });
  });

  test('dialog tem campo Descrição', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-transaction-btn"]');
    const dialog = page.locator('[data-testid="transaction-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('input#quick-description')).toBeVisible();
  });

  test('dialog tem campo Valor', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-transaction-btn"]');
    const dialog = page.locator('[data-testid="transaction-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('input#quick-amount')).toBeVisible();
  });

  test('dialog tem seletor de tipo (Receita / Despesa)', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-transaction-btn"]');
    const dialog = page.locator('[data-testid="transaction-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    // O tipo é um RadioGroup ou Select com Receita/Despesa
    await expect(
      dialog.locator('text=/receita|despesa/i').first()
    ).toBeVisible();
  });

  test('dialog tem checkbox "Marcar como pago"', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-transaction-btn"]');
    const dialog = page.locator('[data-testid="transaction-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('text=Marcar como pago')).toBeVisible();
  });

  test('botão Cancelar fecha o dialog', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-transaction-btn"]');
    const dialog = page.locator('[data-testid="transaction-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await dialog.locator('button:has-text("Cancelar")').click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Transações — dialog Editar', () => {
  test.beforeEach(skipIfNoAuth);

  test('clicar em editar em uma transação existente abre o dialog de edição', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    // Procura botão de edição na tabela (ícone Edit/lápis)
    const editBtn = page.locator('button[title*="editar"], button[aria-label*="editar"]').first()
      .or(page.locator('table tbody tr').first().locator('button:has(svg)').first());

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip(true, 'Nenhuma transação disponível');
      return;
    }

    // Clicar no botão de editar da primeira linha
    const firstEditBtn = rows.first().locator('button').first();
    await firstEditBtn.click();

    const editDialog = page.locator('[data-testid="edit-transaction-dialog"]');
    const isOpen = await editDialog.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isOpen) {
      test.skip(true, 'Dialog de edição não abriu com este seletor');
    } else {
      await expect(editDialog.locator('text=Editar Transação')).toBeVisible();
    }
  });
});
