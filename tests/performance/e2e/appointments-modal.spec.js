import { test, expect } from '@playwright/test';

const skipIfNoAuth = () => {
  if (!process.env.TEST_USER_EMAIL) {
    test.skip(true, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD');
  }
};

async function gotoAppointments(page) {
  await page.goto('/appointments');
  await page.waitForLoadState('networkidle');
  // Wait for the lazy chunk to resolve (avoids race with Suspense fallback)
  await page.waitForSelector('[data-testid="appointments-page"]', { timeout: 15000 });
}

test.describe('Agendamentos — AppointmentForm', () => {
  test.beforeEach(skipIfNoAuth);

  test('clicar em "Novo Agendamento" abre o dialog', async ({ page }) => {
    await gotoAppointments(page);
    await page.click('[data-testid="new-appointment-btn"]');
    await expect(page.locator('[data-testid="appointment-form-dialog"]')).toBeVisible({ timeout: 8000 });
  });

  test('dialog tem campo Profissional', async ({ page }) => {
    await gotoAppointments(page);
    await page.click('[data-testid="new-appointment-btn"]');
    const dialog = page.locator('[data-testid="appointment-form-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('label[for="professional"]')).toBeVisible();
  });

  test('dialog tem campo Serviço', async ({ page }) => {
    await gotoAppointments(page);
    await page.click('[data-testid="new-appointment-btn"]');
    const dialog = page.locator('[data-testid="appointment-form-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('text=Informações do Serviço')).toBeVisible();
  });

  test('botão Cancelar fecha o dialog', async ({ page }) => {
    await gotoAppointments(page);
    await page.click('[data-testid="new-appointment-btn"]');
    const dialog = page.locator('[data-testid="appointment-form-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await page.click('[data-testid="cancel-appointment-btn"]');
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('botão Salvar está visível no dialog', async ({ page }) => {
    await gotoAppointments(page);
    await page.click('[data-testid="new-appointment-btn"]');
    await expect(page.locator('[data-testid="appointment-form-dialog"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="save-appointment-btn"]')).toBeVisible();
  });
});

test.describe('Agendamentos — Sheet do dia no calendário', () => {
  test.beforeEach(skipIfNoAuth);

  test('clicar em um dia no calendário abre o sheet lateral', async ({ page }) => {
    await gotoAppointments(page);

    // Garantir que estamos na aba Calendário (pode ter abas)
    const calendarTab = page.locator('[role="tab"]').filter({ hasText: /calendário/i });
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
    await gotoAppointments(page);

    // Tentar abrir via tabela se houver agendamentos
    const tableTab = page.locator('[role="tab"]').filter({ hasText: /tabela|lista/i });
    if (await tableTab.count() > 0) {
      await tableTab.click();
      await page.waitForTimeout(500);
    }

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      const annotacoesBtn = rows.first().locator('button:has-text("Anotações")');
      if (await annotacoesBtn.count() > 0) {
        await annotacoesBtn.click();
        const consultationModal = page.locator('[data-testid="consultation-modal"]');
        await expect(consultationModal).toBeVisible({ timeout: 8000 });
      } else {
        test.skip(true, 'Botão Anotações não encontrado na primeira linha');
      }
    } else {
      test.skip(true, 'Nenhum agendamento disponível para testar dialog de nota');
    }
  });
});

test.describe('Agendamentos — AlertDialog de exclusão', () => {
  test.beforeEach(skipIfNoAuth);

  test('abre o dialog de confirmação de exclusão', async ({ page }) => {
    await gotoAppointments(page);

    const tableTab = page.locator('[role="tab"]').filter({ hasText: /tabela|lista/i });
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
      // Use role selector to avoid aria-hidden duplicates from mobile card portals
      await expect(page.getByRole('alertdialog', { name: 'Confirmar Exclusão' })).toBeVisible({ timeout: 8000 });
    } else {
      test.skip(true, 'Nenhum agendamento disponível para testar exclusão');
    }
  });

  test('cancelar no dialog de exclusão fecha sem excluir', async ({ page }) => {
    await gotoAppointments(page);

    const tableTab = page.locator('[role="tab"]').filter({ hasText: /tabela|lista/i });
    if (await tableTab.count() > 0) {
      await tableTab.click();
      await page.waitForTimeout(500);
    }

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      const deleteBtn = rows.first().locator('button').last();
      await deleteBtn.click();
      const dialog = page.getByRole('alertdialog', { name: 'Confirmar Exclusão' });
      await expect(dialog).toBeVisible({ timeout: 8000 });
      await dialog.getByRole('button', { name: 'Cancelar' }).click({ force: true });
      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    } else {
      test.skip(true, 'Nenhum agendamento disponível');
    }
  });
});
