import { test, expect } from '@playwright/test';

const skipIfNoAuth = () => {
  if (!process.env.TEST_USER_EMAIL) {
    test.skip(true, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD');
  }
};

test.describe('Links de Agendamento — página', () => {
  test.beforeEach(skipIfNoAuth);

  test('carrega a página', async ({ page }) => {
    await page.goto('/appointment-links');
    await expect(page.locator('[data-testid="appointment-links-page"]')).toBeVisible({ timeout: 12000 });
  });

  test('exibe título "Links de Agendamento"', async ({ page }) => {
    await page.goto('/appointment-links');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Links de Agendamento")')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Links de Agendamento — dialog Novo Link', () => {
  test.beforeEach(skipIfNoAuth);

  test('botão "Novo Link" abre o dialog', async ({ page }) => {
    await page.goto('/appointment-links');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-link-btn"]');
    await expect(page.locator('[data-testid="appointment-link-dialog"]')).toBeVisible({ timeout: 8000 });
  });

  test('dialog exibe título "Criar Novo Link de Agendamento"', async ({ page }) => {
    await page.goto('/appointment-links');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-link-btn"]');
    await expect(page.locator('[data-testid="appointment-link-dialog"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Criar Novo Link de Agendamento')).toBeVisible();
  });

  test('dialog tem campo "Nome do Link"', async ({ page }) => {
    await page.goto('/appointment-links');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-link-btn"]');
    const dialog = page.locator('[data-testid="appointment-link-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('label:has-text("Nome do Link"), input#name')).toBeVisible();
  });

  test('dialog tem campo Descrição', async ({ page }) => {
    await page.goto('/appointment-links');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-link-btn"]');
    const dialog = page.locator('[data-testid="appointment-link-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('label:has-text("Descrição")')).toBeVisible();
  });

  test('botão Cancelar fecha o dialog', async ({ page }) => {
    await page.goto('/appointment-links');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-link-btn"]');
    const dialog = page.locator('[data-testid="appointment-link-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await dialog.locator('button:has-text("Cancelar")').click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Links de Agendamento — dialog Editar Link', () => {
  test.beforeEach(skipIfNoAuth);

  test('botão de editar link abre dialog de edição', async ({ page }) => {
    await page.goto('/appointment-links');
    await page.waitForLoadState('networkidle');

    const editBtn = page.locator('button[title*="editar"], button[aria-label*="editar"]').first()
      .or(page.locator('button:has-text("Editar")').first());

    const count = await editBtn.count();
    if (count === 0) {
      test.skip(true, 'Nenhum link disponível para edição');
      return;
    }

    await editBtn.click();
    await expect(page.locator('[data-testid="edit-link-dialog"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Editar Link de Agendamento')).toBeVisible();
  });
});
