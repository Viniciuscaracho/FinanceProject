// @ts-check
/**
 * INTERACTION TESTS — Fluxos reais de uso da plataforma
 *
 * Testa criação, verificação e remoção dos principais cadastros.
 * Nome único por run via timestamp para evitar colisão de dados no staging.
 */
const { test, expect } = require('@playwright/test');
const { format, addDays } = require('date-fns');

const RUN_ID = Date.now();
const TOMORROW = addDays(new Date(), 1);

// ─────────────────────────────────────────────────────────
// CONTATOS
// ─────────────────────────────────────────────────────────

test.describe('Contatos — criar e excluir', () => {
  const contactName = `E2E Paciente ${RUN_ID}`;

  test('cria novo contato e verifica na lista', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle').catch(() => {});

    await page.getByTestId('new-contact-btn').click();
    const dialog = page.getByTestId('contact-dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByPlaceholder('Nome completo').fill(contactName);
    await dialog.getByPlaceholder('email@exemplo.com').fill(`e2e+${RUN_ID}@teste.com`);
    await dialog.getByPlaceholder('(11) 99999-9999').fill('(11) 91234-5678');

    await dialog.getByRole('button', { name: 'Salvar' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // O nome aparece como h3 no card do contato
    await expect(page.locator('h3').filter({ hasText: contactName }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('exclui o contato criado', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Localiza o card do contato e clica no botão de excluir (lixeira)
    const card = page.locator('.group\\/item').filter({ hasText: contactName });
    await expect(card.first()).toBeVisible({ timeout: 10_000 });

    const trashBtn = card.first().getByRole('button', { name: /excluir paciente/i });
    await trashBtn.click(); // Primeiro clique: mostra "Confirmar?"

    // Segundo clique para confirmar a exclusão
    await page.waitForTimeout(300);
    const confirmBtn = card.first().getByRole('button', { name: /confirmar/i });
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    await expect(page.locator('h3').filter({ hasText: contactName }).first()).not.toBeVisible({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────
// SERVIÇOS
// ─────────────────────────────────────────────────────────

test.describe('Serviços — criar e excluir', () => {
  const serviceName = `E2E Servico ${RUN_ID}`;

  test('cria novo serviço e verifica na lista', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle').catch(() => {});

    await page.getByTestId('new-service-btn').click();
    const dialog = page.getByTestId('service-dialog');
    await expect(dialog).toBeVisible();

    // Click para focar, depois fill para acionar onChange do React
    await dialog.locator('#name').click();
    await dialog.locator('#name').fill(serviceName);
    await expect(dialog.locator('#name')).toHaveValue(serviceName);
    await dialog.locator('#description').fill('Criado por teste E2E automatizado');
    await dialog.locator('#selling_price_cents').click();
    await dialog.locator('#selling_price_cents').fill('150');
    await dialog.locator('#unit').fill('consulta');

    await dialog.getByRole('button', { name: /criar/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // Verifica na linha da tabela (desktop) — h3 fica em layout mobile (css hidden)
    await expect(page.locator('tr').filter({ hasText: serviceName }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('exclui o serviço criado', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Verifica na linha da tabela (desktop) — h3 é layout mobile (css hidden)
    const serviceRow = page.locator('tr').filter({ hasText: serviceName });
    await expect(serviceRow.first()).toBeVisible({ timeout: 10_000 });

    // O botão de excluir fica na TableRow (desktop)
    const row = page.locator('tr').filter({ hasText: serviceName });
    await row.getByTestId('delete-service-btn').click();

    const deleteDialog = page.getByTestId('delete-service-dialog');
    await expect(deleteDialog).toBeVisible({ timeout: 5_000 });
    await deleteDialog.getByRole('button', { name: /confirmar/i }).click();

    await expect(page.locator(`text="${serviceName}"`).first()).not.toBeVisible({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────
// TRANSAÇÕES
// ─────────────────────────────────────────────────────────

test.describe('Transações — criar receita', () => {
  const transactionDesc = `E2E Receita ${RUN_ID}`;
  const dueDate = format(TOMORROW, 'dd/MM/yyyy');

  test('cria nova transação de receita', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle').catch(() => {});

    await page.getByTestId('new-transaction-btn').click();
    const dialog = page.getByTestId('transaction-dialog');
    await expect(dialog).toBeVisible();

    // Seleciona tipo Receita
    await dialog.getByRole('button', { name: 'Receita' }).click();

    await page.locator('#quick-description').fill(transactionDesc);
    await page.locator('#quick-amount').fill('250');
    // fill() em type="text" com máscara dispara onChange corretamente no React
    await page.locator('#quick-date').fill(dueDate);

    // Clica em Salvar (primeiro botão do grid de 2 colunas, antes de Cancelar)
    await dialog.locator('button').filter({ hasText: 'Salvar' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // Verifica pelo atributo title no div desktop (visível) — h3 mobile tem o mesmo title mas fica hidden
    await expect(page.locator(`div[title="${transactionDesc}"]`).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────
// AGENDAMENTOS
// ─────────────────────────────────────────────────────────

test.describe('Agendamentos — criar via formulário', () => {
  let createdAppointmentId = null;

  test.afterEach(async ({ page }) => {
    if (!createdAppointmentId) return;
    const token = await page.evaluate(() => localStorage.getItem('auth_token')).catch(() => null);
    if (!token) return;
    const apiBase = 'https://orbiproject-orbiapp.dzkxmb.easypanel.host/api/v1';
    await page.request.delete(`${apiBase}/appointments/${createdAppointmentId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    }).catch(() => {});
    createdAppointmentId = null;
  });

  test('abre o formulário, seleciona profissional, serviço, data e salva', async ({ page }) => {
    // Captura resposta da API de criação de agendamento para diagnóstico
    let apiResponse = null;
    page.on('response', async response => {
      if (response.url().includes('/appointments') && response.request().method() === 'POST') {
        apiResponse = { status: response.status(), body: await response.json().catch(() => null) };
      }
    });

    await page.goto('/appointments');
    await page.waitForLoadState('networkidle').catch(() => {});

    await page.getByTestId('new-appointment-btn').click();
    const dialog = page.getByTestId('appointment-form-dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Radix SelectTrigger = role="combobox"
    const comboboxes = dialog.getByRole('combobox');
    await expect(comboboxes.first()).toBeVisible({ timeout: 5_000 });
    const count = await comboboxes.count();
    expect(count, 'Precisa de ao menos 2 selects: profissional + serviço').toBeGreaterThanOrEqual(2);

    // Seleciona profissional (1º combobox)
    await comboboxes.nth(0).click();
    await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: 5_000 });
    await page.locator('[role="option"]').first().click();

    // Seleciona serviço (2º combobox)
    await comboboxes.nth(1).click();
    await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: 5_000 });
    await page.locator('[role="option"]').first().click();

    // Abre calendário de início (primeiro botão "Selecione a data")
    await dialog.getByRole('button', { name: /selecione a data/i }).first().click();
    await page.waitForTimeout(300);
    // Foca um botão de dia (necessário para PageDown funcionar no react-day-picker)
    const firstDay = page.locator('button[role="gridcell"]:not([disabled])').first();
    await expect(firstDay).toBeVisible({ timeout: 5_000 });
    await firstDay.focus();
    // Navega 2 meses à frente via teclado para garantir slot sem conflitos históricos
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(300);
    // Em Julho 2026 (jul/1 = qua): .nth(0) = 1/jul (seg) ou último dia do mês anterior
    const availableDays = page.locator('button[role="gridcell"]:not([disabled])');
    await expect(availableDays.first()).toBeVisible({ timeout: 5_000 });
    // Pega o 2º dia disponível para evitar feriados/fins-de-semana do início do mês
    const dayCount = await availableDays.count();
    await availableDays.nth(Math.min(1, dayCount - 1)).click();

    // Usa '09:00' (início do horário de trabalho 9h-18h, sem conflito em junho)
    // '09:00' aparece só nos presets de start_time; end_time presets começam em 10:00
    const timePreset = dialog.getByRole('button', { name: '09:00' }).first();
    await expect(timePreset).toBeVisible({ timeout: 5_000 });
    await timePreset.click();
    // Aguarda o useEffect calcular end_time automaticamente a partir do start_time + service
    await page.waitForTimeout(1_000);

    // Preenche WhatsApp (obrigatório no modelo) — rola para encontrar o campo
    const whatsappInput = dialog.getByPlaceholder(/98765-4321|whatsapp/i);
    await expect(whatsappInput).toBeVisible({ timeout: 5_000 });
    await whatsappInput.fill('(11) 99999-1234');

    // Clica no título do diálogo para garantir que o foco saia de qualquer input nativo
    await dialog.locator('h2').first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);

    // Salva — force:true ignora qualquer overlay residual
    await dialog.getByTestId('save-appointment-btn').click({ force: true });
    // Aguarda resposta da API e loga para diagnóstico
    await page.waitForTimeout(3_000);
    if (apiResponse) {
      console.log('API response status:', apiResponse.status);
      createdAppointmentId = apiResponse.body?.id ?? null;
    } else {
      console.log('API: nenhuma requisição POST /appointments capturada');
    }
    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
    // afterEach cuida da limpeza do agendamento criado
  });
});
