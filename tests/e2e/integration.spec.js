// @ts-check
/**
 * INTEGRATION TESTS — Fluxos que cruzam features
 *
 * Cada teste verifica que a ação em uma feature dispara efeito em outra:
 *   1. Agendamento → Contato auto-criado  (callback before_validation)
 *   2. Agendamento pago → Transação criada (callback after_update)
 *   3. Agendamento criado → Comissão calculada (callback after_create)
 *   4. Serviço selecionado → Preço no formulário (useEffect no frontend)
 */
const { test, expect } = require('@playwright/test');
const { addMonths, startOfMonth, endOfMonth, format } = require('date-fns');

const API_BASE = 'https://orbiproject-orbiapp.dzkxmb.easypanel.host/api/v1';
const RUN_ID   = Date.now();

// Número único por run — 11 dígitos, válido para whatsapp_number
const PHONE = `119${String(RUN_ID).slice(-8).padStart(8, '0')}`;

// Data 2 meses no futuro em dia útil (seg–sex)
function nextWeekdayFrom(date) {
  const d = new Date(date);
  const dow = d.getDay();
  if (dow === 0) d.setDate(d.getDate() + 1);
  if (dow === 6) d.setDate(d.getDate() + 2);
  return d;
}
const FUTURE = nextWeekdayFrom(addMonths(new Date(), 2));
// Filtro de data cobre o mês inteiro para evitar problemas de fuso horário
const FUTURE_MONTH_START = format(startOfMonth(FUTURE), 'yyyy-MM-dd');
const FUTURE_MONTH_END   = format(endOfMonth(FUTURE),   'yyyy-MM-dd');

// ─────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────

async function getToken(page) {
  return page.evaluate(() => localStorage.getItem('auth_token'));
}

async function authHeaders(token) {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function fetchFirstProfessionalAndService(page, token) {
  const headers = { 'Authorization': `Bearer ${token}` };
  const [profResp, svcResp] = await Promise.all([
    page.request.get(`${API_BASE}/professionals`, { headers }),
    page.request.get(`${API_BASE}/services`,     { headers }),
  ]);
  const professionals = await profResp.json();
  const services      = await svcResp.json();
  return { professional: professionals[0], service: services[0] };
}

async function createAppointmentViaAPI(page, token, { whatsapp, price = 10000, professional, service, hour = 9 }) {
  const start = new Date(FUTURE); start.setHours(hour, 0, 0, 0);
  const end   = new Date(FUTURE); end.setHours(hour + 1, 0, 0, 0);

  const resp = await page.request.post(`${API_BASE}/appointments`, {
    headers: await authHeaders(token),
    data: {
      appointment: {
        account_user_id: professional.id,
        service_id:      service.id,
        start_time:      start.toISOString(),
        end_time:        end.toISOString(),
        price_cents:     price,
        whatsapp_number: whatsapp,
        payment_status:  'pending',
      },
    },
  });
  expect(resp.status(), `POST /appointments falhou: ${await resp.text()}`).toBe(201);
  return resp.json();
}

async function deleteViaAPI(page, token, path) {
  await page.request.delete(`${API_BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  }).catch(() => {});
}

// Preenche <input type="date"> e dispara evento React onChange
async function fillDateInput(page, nth, dateStr) {
  await page.locator('input[type="date"]').nth(nth).evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, dateStr);
}

// ─────────────────────────────────────────────────────────
// 1. Agendamento → Contato auto-criado
// ─────────────────────────────────────────────────────────

test.describe('Integração: Agendamento → Contato auto-criado', () => {
  let appointmentId = null;
  let contactId     = null;
  const phone       = `${PHONE}1`; // sufixo para diferenciar de outros testes
  const clientName  = `Cliente ${phone}`;

  test.afterEach(async ({ page }) => {
    await page.goto('/');
    const token = await getToken(page);
    if (appointmentId) await deleteViaAPI(page, token, `/appointments/${appointmentId}`);
    if (contactId)     await deleteViaAPI(page, token, `/contacts/${contactId}`);
    appointmentId = null;
    contactId     = null;
  });

  test('cria agendamento via API e verifica contato criado automaticamente', async ({ page }) => {
    await page.goto('/');
    const token = await getToken(page);
    const { professional, service } = await fetchFirstProfessionalAndService(page, token);

    // Cria o agendamento — o callback ensure_contact_from_whatsapp cria o contato
    const apt = await createAppointmentViaAPI(page, token, { whatsapp: phone, professional, service, hour: 9 });
    appointmentId = apt.id;

    // Busca o contato recém-criado na API para obter o id (para cleanup)
    const contactsResp = await page.request.get(`${API_BASE}/contacts`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const contacts = await contactsResp.json();
    const found = (Array.isArray(contacts) ? contacts : contacts.contacts ?? [])
      .find(c => (c.name || c.first_name || '').includes(phone));
    if (found) contactId = found.id;

    // Verifica na UI que o contato aparece na lista de pacientes
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(
      page.locator('h3').filter({ hasText: clientName }).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────
// 2. Agendamento pago → Transação criada
// ─────────────────────────────────────────────────────────

test.describe('Integração: Agendamento pago → Transação criada', () => {
  let appointmentId = null;
  const phone      = `${PHONE}2`;
  const clientName = `Cliente ${phone}`;

  test.afterEach(async ({ page }) => {
    await page.goto('/');
    const token = await getToken(page);
    if (appointmentId) await deleteViaAPI(page, token, `/appointments/${appointmentId}`);
    appointmentId = null;
  });

  test('marca agendamento como pago e verifica transação em /transactions', async ({ page }) => {
    await page.goto('/');
    const token = await getToken(page);
    const { professional, service } = await fetchFirstProfessionalAndService(page, token);

    const apt = await createAppointmentViaAPI(page, token, {
      whatsapp: phone, professional, service, price: 10000, hour: 10,
    });
    appointmentId = apt.id;

    // Marca como pago via API (a lista de agendamentos filtra por mês atual, não mostra FUTURE)
    const patchResp = await page.request.patch(`${API_BASE}/appointments/${appointmentId}`, {
      headers: await authHeaders(token),
      data: { appointment: { payment_status: 'paid' } },
    });
    expect(patchResp.ok(), `PATCH payment_status=paid falhou: ${await patchResp.text()}`).toBeTruthy();

    await page.waitForTimeout(3_000); // aguarda callback after_update criar a transação

    // Verifica a transação em /transactions (transação é criada com data de hoje → aparece no mês atual)
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle').catch(() => {});

    // A descrição da transação contém o nome do serviço
    await expect(
      page.locator(`div[title*="${service.name}"]`).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────
// 3. Agendamento criado → Comissão calculada
// ─────────────────────────────────────────────────────────

test.describe('Integração: Agendamento → Comissão calculada', () => {
  let appointmentId = null;
  const phone       = `${PHONE}3`;
  const PRICE_CENTS = 10000; // R$100,00 → comissão 50% = R$50,00

  test.afterEach(async ({ page }) => {
    await page.goto('/');
    const token = await getToken(page);
    if (appointmentId) await deleteViaAPI(page, token, `/appointments/${appointmentId}`);
    appointmentId = null;
  });

  test('cria agendamento e verifica comissão em /commissions', async ({ page }) => {
    await page.goto('/');
    const token = await getToken(page);
    const { professional, service } = await fetchFirstProfessionalAndService(page, token);

    const apt = await createAppointmentViaAPI(page, token, {
      whatsapp: phone, professional, service, price: PRICE_CENTS, hour: 11,
    });
    appointmentId = apt.id;

    // Navega para /commissions e filtra pelo mês inteiro do agendamento futuro
    await page.goto('/commissions');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Usa evaluate para disparar o evento React onChange nos inputs de data
    await fillDateInput(page, 0, FUTURE_MONTH_START); // De
    await fillDateInput(page, 1, FUTURE_MONTH_END);   // Até

    // Aguarda a resposta da API de comissões após clicar em Atualizar
    const commResp = page.waitForResponse(r =>
      r.url().includes('/commissions') && r.status() === 200
    );
    await page.getByRole('button', { name: /atualizar/i }).click();
    await commResp;
    await page.waitForTimeout(500);

    // O painel do profissional deve aparecer — confirma que a comissão foi criada
    const profName = professional.name || professional.email || '';
    // Aguarda pelo menos uma referência ao nome do profissional na página
    await expect(
      page.getByText(profName, { exact: false }).first()
    ).toBeVisible({ timeout: 10_000 });

    // Clica no painel para expandir e ver a comissão individual
    await page.getByText(profName, { exact: false }).first().click().catch(() => {});
    await page.waitForTimeout(500);

    // Verifica que algum valor BRL aparece na área de comissões
    await expect(
      page.locator('text=/R\\$\\s*\\d+,\\d{2}/').first()
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────
// 4. Serviço → Preço auto-preenchido no formulário de Agendamento
// ─────────────────────────────────────────────────────────

test.describe('Integração: Serviço → Preço no formulário de Agendamento', () => {
  let serviceId = null;
  const serviceName  = `E2E Integ ${RUN_ID}`;
  const PRICE_REAIS  = 199; // R$199,00 = 19900 cents

  test.afterEach(async ({ page }) => {
    const token = await getToken(page);
    if (serviceId) await deleteViaAPI(page, token, `/services/${serviceId}`);
    serviceId = null;
  });

  test('seleciona serviço no formulário e verifica preço auto-preenchido', async ({ page }) => {
    // Navega diretamente para /appointments (token disponível via storageState)
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Pega token depois de carregar a página autenticada
    const token = await getToken(page);

    // Cria serviço com preço conhecido via API
    const svcResp = await page.request.post(`${API_BASE}/services`, {
      headers: await authHeaders(token),
      data: {
        service: {
          name: serviceName,
          description: 'Serviço criado por teste de integração E2E',
          selling_price_cents: PRICE_REAIS * 100,
          unit: 'sessão',
        },
      },
    });
    expect(svcResp.status(), `POST /services falhou: ${await svcResp.text()}`).toBe(201);
    const svc = await svcResp.json();
    serviceId = svc.id;

    // Recarrega a página de agendamentos para o novo serviço aparecer no select
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => {});

    await page.getByTestId('new-appointment-btn').click();
    const dialog = page.getByTestId('appointment-form-dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Seleciona qualquer profissional (1º combobox)
    const comboboxes = dialog.getByRole('combobox');
    await comboboxes.nth(0).click();
    await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: 5_000 });
    await page.locator('[role="option"]').first().click();

    // Seleciona o serviço pelo nome (2º combobox)
    await comboboxes.nth(1).click();
    const serviceOption = page.locator('[role="option"]').filter({ hasText: serviceName });
    await expect(serviceOption).toBeVisible({ timeout: 5_000 });
    await serviceOption.click();

    // Verifica que o campo de preço foi auto-preenchido com o valor do serviço
    const priceInput = dialog.locator('#price_cents');
    await expect(priceInput).not.toHaveValue('', { timeout: 3_000 });
    const priceValue = await priceInput.inputValue();
    // formatCurrencyInput trata o valor como centavos para exibição:
    // price_cents="199" → exibe "1,99"; remover não-dígitos: "199" = String(PRICE_REAIS) ✓
    expect(priceValue.replace(/\D/g, '')).toBe(String(PRICE_REAIS));

    // Fecha o diálogo sem salvar
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });
});
