import { test, expect } from '@playwright/test';

const skipIfNoAuth = () => {
  if (!process.env.TEST_USER_EMAIL) {
    test.skip(true, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD');
  }
};

test.describe('Profissionais — página', () => {
  test.beforeEach(skipIfNoAuth);

  test('carrega a página', async ({ page }) => {
    await page.goto('/professionals');
    await expect(page.locator('[data-testid="professionals-page"]')).toBeVisible({ timeout: 12000 });
  });

  test('exibe título Profissionais', async ({ page }) => {
    await page.goto('/professionals');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Profissionais")')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Profissionais — dialog criar/editar', () => {
  test.beforeEach(skipIfNoAuth);

  test('botão "Novo Profissional" abre o dialog', async ({ page }) => {
    await page.goto('/professionals');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-professional-btn"]');
    await expect(page.locator('[data-testid="professional-dialog"]')).toBeVisible({ timeout: 8000 });
  });

  test('dialog tem campo Nome', async ({ page }) => {
    await page.goto('/professionals');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-professional-btn"]');
    const dialog = page.locator('[data-testid="professional-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('label:has-text("Nome"), input#first_name')).toBeVisible();
  });

  test('dialog exibe título "Novo Profissional"', async ({ page }) => {
    await page.goto('/professionals');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-professional-btn"]');
    const dialog = page.locator('[data-testid="professional-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('text=Novo Profissional')).toBeVisible();
  });

  test('botão Cancelar fecha o dialog', async ({ page }) => {
    await page.goto('/professionals');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-professional-btn"]');
    const dialog = page.locator('[data-testid="professional-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await dialog.locator('button:has-text("Cancelar")').click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Profissionais — dialog de horários', () => {
  test.beforeEach(skipIfNoAuth);

  test('botão "Horários" abre o dialog de agenda', async ({ page }) => {
    await page.goto('/professionals');
    await page.waitForLoadState('networkidle');

    // Aparece como texto "Horários" nos cards ou title="Configurar horários" na tabela
    const scheduleBtn = page.locator(
      'button[title="Configurar horários"], button:has-text("Horários")'
    ).first();

    if (await scheduleBtn.count() === 0) {
      test.skip(true, 'Nenhum profissional cadastrado para testar horários');
      return;
    }

    await scheduleBtn.click();
    await expect(page.locator('[data-testid="professional-schedule-dialog"]')).toBeVisible({ timeout: 8000 });
  });

  test('dialog de horários tem dias da semana', async ({ page }) => {
    await page.goto('/professionals');
    await page.waitForLoadState('networkidle');

    const scheduleBtn = page.locator(
      'button[title="Configurar horários"], button:has-text("Horários")'
    ).first();
    if (await scheduleBtn.count() === 0) {
      test.skip(true, 'Nenhum profissional cadastrado');
      return;
    }

    await scheduleBtn.click();
    const dialog = page.locator('[data-testid="professional-schedule-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('text=/segunda|terça|quarta|quinta|sexta/i').first()).toBeVisible();
  });

  test('Cancelar fecha o dialog de horários', async ({ page }) => {
    await page.goto('/professionals');
    await page.waitForLoadState('networkidle');

    const scheduleBtn = page.locator(
      'button[title="Configurar horários"], button:has-text("Horários")'
    ).first();
    if (await scheduleBtn.count() === 0) {
      test.skip(true, 'Nenhum profissional cadastrado');
      return;
    }

    await scheduleBtn.click();
    const dialog = page.locator('[data-testid="professional-schedule-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await dialog.locator('button:has-text("Cancelar")').click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});
