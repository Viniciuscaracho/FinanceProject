import { test, expect } from '@playwright/test';

const skipIfNoAuth = () => {
  if (!process.env.TEST_USER_EMAIL) {
    test.skip(true, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD');
  }
};

test.describe('Contatos — página', () => {
  test.beforeEach(skipIfNoAuth);

  test('carrega a página', async ({ page }) => {
    await page.goto('/contacts');
    await expect(page.locator('[data-testid="contacts-page"]')).toBeVisible({ timeout: 12000 });
  });

  test('exibe título Contatos', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Contatos")')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Contatos — dialog Novo Contato', () => {
  test.beforeEach(skipIfNoAuth);

  test('botão "Adicionar Contato" abre o dialog', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-contact-btn"]');
    await expect(page.locator('[data-testid="contact-dialog"]')).toBeVisible({ timeout: 8000 });
  });

  test('dialog tem campo Nome', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-contact-btn"]');
    const dialog = page.locator('[data-testid="contact-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('input[placeholder="Nome completo"]')).toBeVisible();
  });

  test('dialog tem campo Telefone', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-contact-btn"]');
    const dialog = page.locator('[data-testid="contact-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('input[placeholder*="99999"]')).toBeVisible();
  });

  test('dialog tem campo Email', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-contact-btn"]');
    const dialog = page.locator('[data-testid="contact-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('input[type="email"]')).toBeVisible();
  });

  test('dialog exibe título "Novo Contato"', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-contact-btn"]');
    await expect(page.locator('[data-testid="contact-dialog"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Novo Contato')).toBeVisible();
  });

  test('botão Cancelar fecha o dialog', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-contact-btn"]');
    const dialog = page.locator('[data-testid="contact-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await dialog.locator('button:has-text("Cancelar")').click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Contatos — dialog Editar Contato', () => {
  test.beforeEach(skipIfNoAuth);

  test('clicar em editar abre o dialog de edição', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    // Verificar se há contatos
    const editBtn = page.locator('button[title*="editar"], button[aria-label*="editar"], button:has([data-lucide="edit"]), button:has([data-lucide="pencil"])').first();
    const count = await editBtn.count();

    if (count === 0) {
      test.skip(true, 'Nenhum contato disponível para edição');
      return;
    }

    await editBtn.click();
    await expect(page.locator('[data-testid="edit-contact-dialog"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Editar Contato')).toBeVisible();
  });
});
