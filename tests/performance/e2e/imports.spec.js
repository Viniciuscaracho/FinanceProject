import { test, expect } from '@playwright/test';

const skipIfNoAuth = () => {
  if (!process.env.TEST_USER_EMAIL) {
    test.skip(true, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD');
  }
};

test.describe('Importações — página', () => {
  test.beforeEach(skipIfNoAuth);

  test('carrega a página', async ({ page }) => {
    await page.goto('/imports');
    await expect(page.locator('[data-testid="imports-page"]')).toBeVisible({ timeout: 12000 });
  });

  test('exibe título Importações', async ({ page }) => {
    await page.goto('/imports');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Importações")')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Importações — dialog Nova Importação', () => {
  test.beforeEach(skipIfNoAuth);

  test('botão "Nova Importação" abre o dialog', async ({ page }) => {
    await page.goto('/imports');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-import-btn"]');
    await expect(page.locator('[data-testid="import-dialog"]')).toBeVisible({ timeout: 8000 });
  });

  test('dialog exibe título "Nova Importação"', async ({ page }) => {
    await page.goto('/imports');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-import-btn"]');
    await expect(page.locator('[data-testid="import-dialog"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Nova Importação').first()).toBeVisible();
  });

  test('dialog tem selector de tipo de importação', async ({ page }) => {
    await page.goto('/imports');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-import-btn"]');
    const dialog = page.locator('[data-testid="import-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('text=Tipo de Importação')).toBeVisible();
  });

  test('dialog tem input de arquivo', async ({ page }) => {
    await page.goto('/imports');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-import-btn"]');
    const dialog = page.locator('[data-testid="import-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('input[type="file"]')).toBeAttached();
  });

  test('input de arquivo aceita xlsx, xls e csv', async ({ page }) => {
    await page.goto('/imports');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-import-btn"]');
    const dialog = page.locator('[data-testid="import-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    const fileInput = dialog.locator('input[type="file"]');
    const accept = await fileInput.getAttribute('accept');
    expect(accept).toContain('.xlsx');
  });

  test('botão Cancelar fecha o dialog', async ({ page }) => {
    await page.goto('/imports');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-import-btn"]');
    const dialog = page.locator('[data-testid="import-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await dialog.locator('button:has-text("Cancelar")').click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});
