import { test, expect } from '@playwright/test';

const skipIfNoAuth = () => {
  if (!process.env.TEST_USER_EMAIL) {
    test.skip(true, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD');
  }
};

test.describe('Agendamentos — AppointmentForm', () => {
  test.beforeEach(skipIfNoAuth);

  test('clicar em "Novo Agendamento" abre o dialog', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-appointment-btn"]');
    await expect(page.locator('[data-testid="appointment-form-dialog"]')).toBeVisible({ timeout: 8000 });
  });

  test('dialog tem campo Profissional', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-appointment-btn"]');
    const dialog = page.locator('[data-testid="appointment-form-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('text=Profissional')).toBeVisible();
  });

  test('dialog tem campo Serviço', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-appointment-btn"]');
    const dialog = page.locator('[data-testid="appointment-form-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('text=Informações do Serviço')).toBeVisible();
  });

  test('botão Cancelar fecha o dialog', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-appointment-btn"]');
    const dialog = page.locator('[data-testid="appointment-form-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await page.click('[data-testid="cancel-appointment-btn"]');
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('botão Salvar está visível no dialog', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="new-appointment-btn"]');
    await expect(page.locator('[data-testid="appointment-form-dialog"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="save-appointment-btn"]')).toBeVisible();
  });
});

test.describe('Agendamentos — Sheet do dia no calendário', () => {
  test.beforeEach(skipIfNoAuth);

  test('clicar em um dia no calendário abre o sheet lateral', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');

    // Garantir que estamos na aba Calendário (pode ter abas)
    const calendarTab = page.locator('[role="tab"]:has-text(/calendário/i)');
    if (await calendarTab.count() > 0) {
      await calendarTab.click();
      await page.waitForTimeout(500);
    }

    // Clicar em um dia disponível no calendário (rbc = react-big-calendar)
    const dayCell = page.locator('.rbc-date-cell, .rbc-day-bg, [class*="rbc-month-row"] .rbc-date-cell').first();
    if (await dayCell.count() > 0) {
      await dayCell.click();
      await expect(page.locator('[data-testid="day-sheet"]')).toBeVisible({ timeout: 8000 });
    } else {
      test.skip(true, 'Calendário não encontrado na view atual');
    }
  });
});

test.describe('Agendamentos — Dialog de nota', () => {
  test.beforeEach(skipIfNoAuth);

  test('abre o dialog de nota a partir de um agendamento existente', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');

    // Tentar abrir via tabela se houver agendamentos
    const tableTab = page.locator('[role="tab"]:has-text(/tabela|lista/i)');
    if (await tableTab.count() > 0) {
      await tableTab.click();
      await page.waitForTimeout(500);
    }

    // Procura botão de nota (ícone FileText/nota) na tabela
    const noteBtn = page.locator('button[title*="nota"], button[aria-label*="nota"], button:has([data-lucide="file-text"]), button:has(svg)').filter({ hasText: '' }).first();
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Tentar encontrar o botão de nota na primeira linha
      const firstRowNoteBtn = rows.first().locator('button').filter({ has: page.locator('svg') }).nth(0);
      if (await firstRowNoteBtn.count() > 0) {
        await firstRowNoteBtn.click();
        // O note-dialog pode abrir — verificar
        const noteDialog = page.locator('[data-testid="note-dialog"]');
        const consultationModal = page.locator('[data-testid="consultation-modal"]');
        await expect(noteDialog.or(consultationModal)).toBeVisible({ timeout: 8000 });
      }
    } else {
      test.skip(true, 'Nenhum agendamento disponível para testar dialog de nota');
    }
  });
});

test.describe('Agendamentos — AlertDialog de exclusão', () => {
  test.beforeEach(skipIfNoAuth);

  test('abre o dialog de confirmação de exclusão', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');

    const tableTab = page.locator('[role="tab"]:has-text(/tabela|lista/i)');
    if (await tableTab.count() > 0) {
      await tableTab.click();
      await page.waitForTimeout(500);
    }

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Último botão na linha (normalmente delete/trash)
      const deleteBtn = rows.first().locator('button').last();
      await deleteBtn.click();
      await expect(page.locator('[data-testid="delete-appointment-dialog"]')).toBeVisible({ timeout: 8000 });
    } else {
      test.skip(true, 'Nenhum agendamento disponível para testar exclusão');
    }
  });

  test('cancelar no dialog de exclusão fecha sem excluir', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');

    const tableTab = page.locator('[role="tab"]:has-text(/tabela|lista/i)');
    if (await tableTab.count() > 0) {
      await tableTab.click();
      await page.waitForTimeout(500);
    }

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      const deleteBtn = rows.first().locator('button').last();
      await deleteBtn.click();
      const dialog = page.locator('[data-testid="delete-appointment-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 8000 });
      // Cancelar
      await dialog.locator('button:has-text(/cancelar/i)').click();
      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    } else {
      test.skip(true, 'Nenhum agendamento disponível');
    }
  });
});
