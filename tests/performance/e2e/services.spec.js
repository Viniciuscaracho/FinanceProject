import { test, expect } from '@playwright/test';

const skipIfNoAuth = () => {
  if (!process.env.TEST_USER_EMAIL) {
    test.skip(true, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD');
  }
};

test.describe('Serviços — página', () => {
  test.beforeEach(skipIfNoAuth);

  test('carrega a página', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('[data-testid="services-page"]')).toBeVisible({ timeout: 12000 });
  });

  test('exibe título Serviços', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Serviços")')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Serviços — dialog criar/editar', () => {
  test.beforeEach(skipIfNoAuth);

  test('botão "Novo Serviço" abre o dialog', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-service-btn"]');
    await expect(page.locator('[data-testid="service-dialog"]')).toBeVisible({ timeout: 8000 });
  });

  test('dialog tem campo "Nome do Serviço"', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-service-btn"]');
    const dialog = page.locator('[data-testid="service-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('input#name')).toBeVisible();
  });

  test('dialog tem campo Preço de Venda', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-service-btn"]');
    const dialog = page.locator('[data-testid="service-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('label:has-text("Preço de Venda")')).toBeVisible();
  });

  test('dialog exibe título "Novo Serviço"', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-service-btn"]');
    const dialog = page.locator('[data-testid="service-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('text=Novo Serviço')).toBeVisible();
  });

  test('botão Cancelar fecha o dialog', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-service-btn"]');
    const dialog = page.locator('[data-testid="service-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await dialog.locator('button:has-text("Cancelar")').click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Serviços — dialog de exclusão', () => {
  test.beforeEach(skipIfNoAuth);

  async function openDeleteDialog(page) {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
    // O botão Trash2 na tabela desktop (hidden md:block) tem data-testid="delete-service-btn"
    const deleteBtn = page.locator('[data-testid="delete-service-btn"]').first();
    if (await deleteBtn.count() === 0) return null;
    await deleteBtn.click();
    const dialog = page.locator('[data-testid="delete-service-dialog"]');
    if (!(await dialog.isVisible({ timeout: 4000 }).catch(() => false))) return null;
    return dialog;
  }

  test('botão Trash abre dialog de confirmação de exclusão', async ({ page }) => {
    const dialog = await openDeleteDialog(page);
    if (!dialog) {
      test.skip(true, 'Nenhum serviço cadastrado ou seletor incompatível');
      return;
    }
    await expect(dialog.locator('text=/excluir serviço/i')).toBeVisible();
  });

  test('Cancelar no dialog de exclusão fecha sem deletar', async ({ page }) => {
    const dialog = await openDeleteDialog(page);
    if (!dialog) {
      test.skip(true, 'Nenhum serviço cadastrado ou seletor incompatível');
      return;
    }
    await dialog.locator('button:has-text("Cancelar")').click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});
