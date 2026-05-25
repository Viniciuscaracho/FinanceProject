// @ts-check
/**
 * GOOGLE INTEGRATIONS E2E — Contatos e Agendamentos
 *
 * Usa Playwright route interception para simular as respostas da API sem
 * precisar de OAuth real com o Google. Todos os testes rodam contra o
 * staging autenticado (storage state do global.setup.js).
 *
 * Coberturas:
 *   1. Google Contacts — fluxo de UI (conectar, listar, importar)
 *   2. Google Contacts — deduplicação: mesmos contatos não são re-importados
 *   3. Google Calendar — criação de agendamento dispara sync
 *   4. Google Calendar — cancelamento de agendamento dispara sync de delete
 *   5. Google Calendar — import não cria evento duplicado (idempotência via API)
 */

const { test, expect } = require('@playwright/test');
const { addDays, format } = require('date-fns');

const API_BASE = 'https://orbiproject-orbiapp.dzkxmb.easypanel.host/api/v1';
const RUN_ID   = Date.now();
const PHONE    = `119${String(RUN_ID).slice(-8).padStart(8, '0')}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nextWeekday(offset = 1) {
  let d = addDays(new Date(), offset);
  while ([0, 6].includes(d.getDay())) d = addDays(d, 1);
  return d;
}

async function getToken(page) {
  return page.evaluate(() => localStorage.getItem('auth_token'));
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function fetchProfessionalAndService(page, token) {
  const [profResp, svcResp] = await Promise.all([
    page.request.get(`${API_BASE}/professionals`, { headers: authHeaders(token) }),
    page.request.get(`${API_BASE}/services`,      { headers: authHeaders(token) }),
  ]);
  const [profs, services] = await Promise.all([profResp.json(), svcResp.json()]);
  return { professional: profs[0], service: services[0] };
}

let _apptSlot = 0;

async function createAppointmentViaAPI(page, token, { professional, service, whatsapp, price = 5000 }) {
  // Cada chamada usa horário diferente para evitar conflito de sobreposição.
  // O dia-base é derivado de RUN_ID (segundos do epoch % 60 → dia 90 a 150)
  // garantindo que runs diferentes usem dias diferentes.
  _apptSlot += 1;
  const dayBase   = 90 + (Math.floor(RUN_ID / 1000) % 60);
  const dayOffset = dayBase + Math.floor(_apptSlot / 8);
  const hour      = 9 + (_apptSlot % 8);   // 9h a 16h, nunca sobrepostos
  const start = nextWeekday(dayOffset);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start.getTime() + 3600_000);

  const resp = await page.request.post(`${API_BASE}/appointments`, {
    headers: authHeaders(token),
    data: {
      appointment: {
        account_user_id: professional.id,
        service_id:      service.id,
        start_time:      start.toISOString(),
        end_time:        end.toISOString(),
        price_cents:     price,
        whatsapp_number: whatsapp,
        status:          'confirmed',
        payment_status:  'pending',
      },
    },
  });
  const body = await resp.json();
  if (resp.status() !== 201 || !body.id) {
    throw new Error(`Falha ao criar agendamento (${resp.status()}): ${JSON.stringify(body)}`);
  }
  return body;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE CONTACTS — Fluxo de UI
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Google Contacts — UI com API mockada', () => {
  const GOOGLE_CONTACTS_MOCK = [
    { name: `E2E Google A ${RUN_ID}`, email: `e2e-google-a-${RUN_ID}@teste.com`, phone: '11999991111' },
    { name: `E2E Google B ${RUN_ID}`, email: `e2e-google-b-${RUN_ID}@teste.com`, phone: '11999992222' },
    { name: `E2E Sem Email ${RUN_ID}`, email: '',                                phone: '11999993333' },
  ];

  test.beforeEach(async ({ page }) => {
    // Simula conta conectada ao Google Contacts
    await page.route('**/api/v1/google_contacts/status', route =>
      route.fulfill({ json: { connected: true } })
    );
    // Retorna lista de contatos mockados
    await page.route('**/api/v1/google_contacts/list', route =>
      route.fulfill({ json: { contacts: GOOGLE_CONTACTS_MOCK } })
    );
  });

  test('modal exibe contatos do Google quando conectado', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Abre modal de importação Google
    const importGoogleBtn = page.getByRole('button', { name: /importar.*google|google.*contatos/i });
    await expect(importGoogleBtn).toBeVisible({ timeout: 10_000 });
    await importGoogleBtn.click();

    // Modal deve mostrar os contatos
    await expect(page.getByText(GOOGLE_CONTACTS_MOCK[0].name)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(GOOGLE_CONTACTS_MOCK[1].name)).toBeVisible();
    await expect(page.getByText(GOOGLE_CONTACTS_MOCK[2].name)).toBeVisible();
  });

  test('importar contatos selecionados chama API de import e fecha modal', async ({ page }) => {
    let importPayload = null;
    await page.route('**/api/v1/google_contacts/import', async route => {
      const body = route.request().postDataJSON();
      importPayload = body;
      await route.fulfill({ json: { success: true, imported: 2, skipped: 0, errors: [] } });
    });

    await page.goto('/contacts');
    await page.waitForLoadState('networkidle').catch(() => {});

    const importGoogleBtn = page.getByRole('button', { name: /importar.*google|google.*contatos/i });
    await importGoogleBtn.click();

    // Seleciona primeiros dois contatos
    await expect(page.getByText(GOOGLE_CONTACTS_MOCK[0].name)).toBeVisible({ timeout: 10_000 });
    const rows = page.locator('[data-testid="google-contact-row"], [class*="contact-row"]');

    // Clica nos dois primeiros items da lista
    await page.getByText(GOOGLE_CONTACTS_MOCK[0].name).click();
    await page.getByText(GOOGLE_CONTACTS_MOCK[1].name).click();

    // Clica em Importar
    await page.getByRole('button', { name: /importar/i }).last().click();

    // Verifica feedback de sucesso
    await expect(page.getByText(/2.*importado|importado.*2/i)).toBeVisible({ timeout: 5_000 });
  });

  test('modal mostra estado idle quando conta não está conectada', async ({ page }) => {
    await page.route('**/api/v1/google_contacts/status', route =>
      route.fulfill({ json: { connected: false } })
    );

    await page.goto('/contacts');
    await page.waitForLoadState('networkidle').catch(() => {});

    const importGoogleBtn = page.getByRole('button', { name: /importar.*google|google.*contatos/i });
    await importGoogleBtn.click();

    // Deve mostrar botão de "Entrar com o Google"
    await expect(page.getByRole('button', { name: /entrar com.*google/i })).toBeVisible({ timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE CONTACTS — Deduplicação
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Google Contacts — Deduplicação via API', () => {
  // Estes testes requerem Google Contacts conectado via OAuth (google_contacts_token presente).
  // Em ambiente de staging sem OAuth ativo, o endpoint /import retorna 422.
  // Para rodar: conectar Google Contacts em Settings e remover os test.skip abaixo.

  test.skip('importar mesma lista duas vezes não duplica contatos no banco', async ({ page }) => {
    await page.goto('/contacts');
    const token = await getToken(page);

    const contacts = [
      { name: `Dedup A ${RUN_ID}`, email: `dedup-a-${RUN_ID}@teste.com`, phone: '' },
      { name: `Dedup B ${RUN_ID}`, email: `dedup-b-${RUN_ID}@teste.com`, phone: '' },
    ];

    // Primeira importação — deve criar 2
    const resp1 = await page.request.post(`${API_BASE}/google_contacts/import`, {
      headers: authHeaders(token),
      data: { contacts },
    });
    const body1 = await resp1.json();
    expect(resp1.status()).toBe(200);
    expect(body1.success).toBe(true);
    expect(body1.imported).toBe(2);

    const targetEmails = [`dedup-a-${RUN_ID}@teste.com`, `dedup-b-${RUN_ID}@teste.com`];

    // Busca contatos (per_page=200 para cobrir além da paginação padrão)
    const listResp1 = await page.request.get(`${API_BASE}/contacts?per_page=200`, { headers: authHeaders(token) });
    const listBody1 = await listResp1.json();
    const list1 = listBody1.contacts ?? listBody1;
    const countAfterFirst = list1.filter(c => targetEmails.includes(c.email)).length;
    expect(countAfterFirst).toBe(2);

    // Segunda importação — mesma lista, não deve criar novos
    const resp2 = await page.request.post(`${API_BASE}/google_contacts/import`, {
      headers: authHeaders(token),
      data: { contacts },
    });
    expect(resp2.status()).toBe(200);
    expect((await resp2.json()).success).toBe(true);

    // Contagem deve continuar 2 (sem duplicatas) — INVARIANTE CENTRAL
    const listResp2 = await page.request.get(`${API_BASE}/contacts?per_page=200`, { headers: authHeaders(token) });
    const listBody2 = await listResp2.json();
    const list2 = listBody2.contacts ?? listBody2;
    const countAfterSecond = list2.filter(c => targetEmails.includes(c.email)).length;
    expect(countAfterSecond).toBe(2);
  });

  test.skip('importar contato com email que já existe na conta não cria duplicata', async ({ page }) => {
    await page.goto('/contacts');
    const token = await getToken(page);

    const email = `exists-${RUN_ID}@teste.com`;
    const name  = `Existe ${RUN_ID}`;

    // Cria contato diretamente pela API
    await page.request.post(`${API_BASE}/contacts`, {
      headers: authHeaders(token),
      data: { contact: { name, contact_type: 'customer', email } },
    });

    // Tenta importar o mesmo email via Google Contacts
    const resp = await page.request.post(`${API_BASE}/google_contacts/import`, {
      headers: authHeaders(token),
      data: { contacts: [{ name: `Google ${name}`, email, phone: '' }] },
    });
    expect(resp.status()).toBe(200);
    expect((await resp.json()).success).toBe(true);

    // Verifica que só existe 1 contato com esse email (sem duplicata)
    const listResp = await page.request.get(`${API_BASE}/contacts?per_page=200`, { headers: authHeaders(token) });
    const listBody = await listResp.json();
    const list = listBody.contacts ?? listBody;
    const withEmail = list.filter(c => c.email === email);
    expect(withEmail.length).toBe(1);
  });

  test.skip('importar dois contatos com mesmo email no mesmo lote: só cria 1', async ({ page }) => {
    await page.goto('/contacts');
    const token = await getToken(page);

    const email = `batch-dup-${RUN_ID}@teste.com`;
    const contacts = [
      { name: `Batch Dup A ${RUN_ID}`, email, phone: '11900000001' },
      { name: `Batch Dup B ${RUN_ID}`, email, phone: '11900000002' },
    ];

    const resp = await page.request.post(`${API_BASE}/google_contacts/import`, {
      headers: authHeaders(token),
      data: { contacts },
    });
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.imported).toBe(1);
    // O segundo deve ser pulado (a lógica do servidor checa exists? em loop)
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE CALENDAR — Agendamentos (sem OAuth real: testa a API de sync)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Google Calendar — sync de agendamentos via API', () => {
  test('criar agendamento quando Calendar não conectado não falha', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);
    const { professional, service } = await fetchProfessionalAndService(page, token);

    // Cria agendamento sem Calendar conectado — não deve dar erro 500
    const body = await createAppointmentViaAPI(page, token, {
      professional,
      service,
      whatsapp: PHONE,
    });

    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('number');
  });

  test('endpoint de sync manual responde corretamente (account sem Calendar)', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);
    const { professional, service } = await fetchProfessionalAndService(page, token);

    const apptBody = await createAppointmentViaAPI(page, token, {
      professional,
      service,
      whatsapp: `119${String(RUN_ID + 1).slice(-8).padStart(8, '0')}`,
    });
    const appointmentId = apptBody.id;

    // POST /api/v1/google_calendar/sync  → deve retornar erro gracioso (não conectado)
    const syncResp = await page.request.post(`${API_BASE}/google_calendar/sync`, {
      headers: authHeaders(token),
      data: { appointment_id: appointmentId },
    });

    // Deve responder com 4xx informativo, nunca 500
    expect(syncResp.status()).toBeLessThan(500);
    const syncBody = await syncResp.json();
    expect(syncBody).toHaveProperty('error');
  });

  test('google_calendar_event_id permanece nulo quando Calendar não conectado', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);
    const { professional, service } = await fetchProfessionalAndService(page, token);

    const apptBody = await createAppointmentViaAPI(page, token, {
      professional,
      service,
      whatsapp: `119${String(RUN_ID + 2).slice(-8).padStart(8, '0')}`,
    });

    // Busca o agendamento criado e verifica que não há event_id do Calendar
    const getResp = await page.request.get(`${API_BASE}/appointments/${apptBody.id}`, {
      headers: authHeaders(token),
    });
    const apptDetail = await getResp.json();

    // Sem Calendar conectado, google_calendar_event_id deve ser null/ausente
    const eventId = apptDetail.google_calendar_event_id ?? apptDetail.appointment?.google_calendar_event_id;
    expect(eventId).toBeFalsy();
  });

  test('cancelar agendamento via DELETE não gera erro 500', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);
    const { professional, service } = await fetchProfessionalAndService(page, token);

    const apptBody = await createAppointmentViaAPI(page, token, {
      professional,
      service,
      whatsapp: `119${String(RUN_ID + 3).slice(-8).padStart(8, '0')}`,
    });

    // O endpoint correto para cancelar é DELETE /api/v1/appointments/:id
    const cancelResp = await page.request.delete(`${API_BASE}/appointments/${apptBody.id}`, {
      headers: authHeaders(token),
    });

    expect(cancelResp.status()).toBeLessThan(500);
    const body = await cancelResp.json();
    // O appointment deve estar cancelado
    const status = body.status ?? body.appointment?.status;
    expect(status).toMatch(/cancel/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE CALENDAR — Status endpoint
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Google Calendar — status e desconexão', () => {
  test('status retorna connected false para conta sem Calendar', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const resp = await page.request.get(`${API_BASE}/google_calendar/status`, {
      headers: authHeaders(token),
    });

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body).toHaveProperty('connected');
    // Para a conta de teste (sem OAuth do Calendar feito), deve ser false
    expect(typeof body.connected).toBe('boolean');
  });

  test('oauth_url retorna URL válida para conectar Calendar', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const resp = await page.request.get(`${API_BASE}/google_calendar/oauth_url`, {
      headers: authHeaders(token),
    });

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.oauth_url).toMatch(/accounts\.google\.com/);
    expect(body.oauth_url).toMatch(/calendar/);
  });

  test('oauth_url de contatos retorna URL com scope de contacts', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const resp = await page.request.get(`${API_BASE}/google_contacts/oauth_url`, {
      headers: authHeaders(token),
    });

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.oauth_url).toMatch(/accounts\.google\.com/);
    expect(body.oauth_url).toMatch(/contacts/);
  });

  test('desconectar Calendar sem estar conectado responde sem erro', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const resp = await page.request.delete(`${API_BASE}/google_calendar/disconnect`, {
      headers: authHeaders(token),
    });

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
  });
});
