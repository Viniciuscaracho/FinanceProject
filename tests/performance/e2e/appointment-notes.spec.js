import { test, expect } from '@playwright/test';

const skipIfNoAuth = () => {
  if (!process.env.TEST_USER_EMAIL) {
    test.skip(true, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD');
  }
};

test.describe('Anotações de Sessões — página', () => {
  test.beforeEach(skipIfNoAuth);

  test('carrega a página', async ({ page }) => {
    await page.goto('/appointment-notes');
    await expect(page.locator('[data-testid="appointment-notes-page"]')).toBeVisible({ timeout: 12000 });
  });

  test('exibe título "Anotações de Sessões"', async ({ page }) => {
    await page.goto('/appointment-notes');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Anotações de Sessões")')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Anotações de Sessões — dialog criar/editar nota', () => {
  test.beforeEach(skipIfNoAuth);

  test('clicar em um agendamento da lista abre o dialog de nota', async ({ page }) => {
    await page.goto('/appointment-notes');
    await page.waitForLoadState('networkidle');

    // Cada item da lista é um <button> que abre o dialog de nota
    const appointmentItems = page.locator('[data-testid="appointment-notes-page"] button.w-full');
    const count = await appointmentItems.count();

    if (count === 0) {
      test.skip(true, 'Nenhum agendamento na lista de anotações');
      return;
    }

    await appointmentItems.first().click();
    await expect(page.locator('[data-testid="appointment-note-dialog"]')).toBeVisible({ timeout: 8000 });
  });

  test('dialog tem campo de anotação', async ({ page }) => {
    await page.goto('/appointment-notes');
    await page.waitForLoadState('networkidle');

    const appointmentItems = page.locator('[data-testid="appointment-notes-page"] button.w-full');
    const count = await appointmentItems.count();

    if (count === 0) {
      test.skip(true, 'Nenhum agendamento na lista');
      return;
    }

    await appointmentItems.first().click();
    const dialog = page.locator('[data-testid="appointment-note-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('label:has-text("Anotação"), textarea')).toBeVisible();
  });

  test('fechar o dialog (X ou Cancelar) fecha sem salvar', async ({ page }) => {
    await page.goto('/appointment-notes');
    await page.waitForLoadState('networkidle');

    const appointmentItems = page.locator('[data-testid="appointment-notes-page"] button.w-full');
    const count = await appointmentItems.count();

    if (count === 0) {
      test.skip(true, 'Nenhum agendamento na lista');
      return;
    }

    await appointmentItems.first().click();
    const dialog = page.locator('[data-testid="appointment-note-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });

    // Fechar pelo botão X do Dialog (Radix UI coloca aria-label="Close")
    const closeBtn = dialog.locator('button[aria-label="Close"], button[aria-label="Fechar"]').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
    } else {
      // Fallback: tecla Escape
      await page.keyboard.press('Escape');
    }

    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Anotações de Sessões — AlertDialog de exclusão', () => {
  test.beforeEach(skipIfNoAuth);

  test('botão de lixeira em nota existente abre o AlertDialog de confirmação', async ({ page }) => {
    await page.goto('/appointment-notes');
    await page.waitForLoadState('networkidle');

    // O botão de delete só aparece quando o item já tem nota (hasNote = true)
    // Ele está dentro do item da lista com stopPropagation
    const deleteBtn = page.locator(
      '[data-testid="appointment-notes-page"] button:has(svg)'
    ).filter({ hasNot: page.locator('.w-full') }).first();

    const count = await page.locator('[data-testid="appointment-notes-page"] button.w-full').count();

    if (count === 0) {
      test.skip(true, 'Nenhum agendamento para testar exclusão de nota');
      return;
    }

    // Tentar encontrar botão de delete (Trash) dentro dos itens
    const trashBtns = page.locator('[data-testid="appointment-notes-page"] .flex.items-center.gap-1 button');
    const trashCount = await trashBtns.count();

    if (trashCount === 0) {
      test.skip(true, 'Nenhuma nota existente para deletar');
      return;
    }

    await trashBtns.first().click();
    await expect(page.locator('[data-testid="delete-note-dialog"]')).toBeVisible({ timeout: 8000 });
  });

  test('Cancelar no AlertDialog de exclusão fecha sem deletar', async ({ page }) => {
    await page.goto('/appointment-notes');
    await page.waitForLoadState('networkidle');

    const trashBtns = page.locator('[data-testid="appointment-notes-page"] .flex.items-center.gap-1 button');
    const trashCount = await trashBtns.count();

    if (trashCount === 0) {
      test.skip(true, 'Nenhuma nota existente para deletar');
      return;
    }

    await trashBtns.first().click();
    const dialog = page.locator('[data-testid="delete-note-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await dialog.locator('button:has-text(/cancelar/i)').click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});
