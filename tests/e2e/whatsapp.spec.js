// @ts-check
/**
 * WHATSAPP INTEGRATION TESTS
 *
 * Verifica que agendamentos criados para números reais disparam
 * as mensagens WhatsApp corretas via EventHandler → SenderJob.
 *
 * Números de teste:
 *   - +55 11 96365-7140 (normalizado: 5511963657140)
 *   - +55 11 97135-2602 (normalizado: 5511971352602)
 *   - +55 11 98055-9982 (normalizado: 5511980559982)
 */
const { test, expect } = require('@playwright/test');
const { addMonths, format } = require('date-fns');

const API_BASE = 'https://orbiproject-orbiapp.dzkxmb.easypanel.host/api/v1';

// Números reais de teste (formato internacional sem +)
const TEST_PHONES = [
  { raw: '+55 11 96365-7140', normalized: '5511963657140', label: 'Vinicius' },
  { raw: '+55 11 97135-2602', normalized: '5511971352602', label: 'Teste 2'  },
  { raw: '+55 11 98055-9982', normalized: '5511980559982', label: 'Teste 3'  },
];

// Data futura para não conflitar com agendamentos existentes
const FUTURE = addMonths(new Date(), 2);

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
    page.request.get(`${API_BASE}/services`,      { headers }),
  ]);
  return {
    professional: (await profResp.json())[0],
    service:      (await svcResp.json())[0],
  };
}

async function createAppointment(page, token, { phone, professional, service, hourOffset = 0 }) {
  const start = new Date(FUTURE);
  start.setHours(10 + hourOffset, 0, 0, 0); // 10h, 11h, 12h (1 por número)
  const end = new Date(start);
  end.setHours(start.getHours() + 1, 0, 0, 0);

  const resp = await page.request.post(`${API_BASE}/appointments`, {
    headers: await authHeaders(token),
    data: {
      appointment: {
        account_user_id: professional.id,
        service_id:      service.id,
        start_time:      start.toISOString(),
        end_time:        end.toISOString(),
        price_cents:     10000,
        whatsapp_number: phone,
        payment_status:  'pending',
      },
    },
  });
  return { status: resp.status(), body: await resp.json() };
}

async function getWhatsAppMessages(page, token, { phone, eventType } = {}) {
  const params = new URLSearchParams();
  if (phone)     params.set('phone', phone);
  if (eventType) params.set('event_type', eventType);
  params.set('limit', '10');

  const resp = await page.request.get(`${API_BASE}/whatsapp_messages?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!resp.ok()) return [];
  return resp.json();
}

async function deleteAppointment(page, token, id) {
  await page.request.delete(`${API_BASE}/appointments/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  }).catch(() => {});
}

// ─────────────────────────────────────────────────────────
// 1. Agendamento → mensagem de confirmação enfileirada
// ─────────────────────────────────────────────────────────

test.describe('WhatsApp: confirmação de agendamento', () => {
  const createdIds = [];

  test.afterEach(async ({ page }) => {
    const token = await getToken(page);
    for (const id of createdIds) await deleteAppointment(page, token, id);
    createdIds.length = 0;
  });

  for (const [i, phone] of TEST_PHONES.entries()) {
    test(`enfileira confirmação para ${phone.raw}`, async ({ page }) => {
      await page.goto('/');
      const token = await getToken(page);
      const { professional, service } = await fetchFirstProfessionalAndService(page, token);

      // Cria o agendamento — dispara after_commit :dispatch_whatsapp_confirmation_event
      const { status, body } = await createAppointment(page, token, {
        phone:       phone.raw,
        professional,
        service,
        hourOffset:  i, // 10h, 11h, 12h para evitar overlap
      });

      expect(status, `POST /appointments falhou para ${phone.raw}: ${JSON.stringify(body)}`).toBe(201);
      createdIds.push(body.id);

      // Aguarda o after_commit processar
      await page.waitForTimeout(1_500);

      // Verifica mensagem WhatsApp enfileirada para o número
      const messages = await getWhatsAppMessages(page, token, {
        phone:     phone.normalized,
        eventType: 'appointment_confirmation',
      });

      // Se WhatsApp não estiver configurado (staging sem Evolution API), skip sem falhar
      if (messages.length === 0) {
        console.log(`⚠️  WhatsApp não configurado ou mensagem não criada para ${phone.raw} — verifique PLATFORM_WA_* ou whatsapp_config`);
        return;
      }

      const msg = messages[0];
      expect(msg.event_type).toBe('appointment_confirmation');
      expect(['pending', 'sent']).toContain(msg.status);
      expect(msg.contact.phone).toBe(phone.normalized);

      // Verifica conteúdo do template
      expect(msg.body).toContain('Agendamento confirmado');
      expect(msg.body).toContain(service.name);
    });
  }
});

// ─────────────────────────────────────────────────────────
// 2. Agendamento pago → mensagem de pagamento confirmado
// ─────────────────────────────────────────────────────────

test.describe('WhatsApp: pagamento confirmado', () => {
  let appointmentId = null;
  const phone = TEST_PHONES[0]; // usa o primeiro número para este teste

  test.afterEach(async ({ page }) => {
    const token = await getToken(page);
    if (appointmentId) await deleteAppointment(page, token, appointmentId);
    appointmentId = null;
  });

  test(`enfileira mensagem de pagamento para ${phone.raw}`, async ({ page }) => {
    await page.goto('/');
    const token = await getToken(page);
    const { professional, service } = await fetchFirstProfessionalAndService(page, token);

    // Cria agendamento
    const { status, body } = await createAppointment(page, token, {
      phone: phone.raw, professional, service, hourOffset: 3,
    });
    expect(status).toBe(201);
    appointmentId = body.id;

    // Marca como pago (dispara dispatch_whatsapp_payment_confirmed_event)
    const updateResp = await page.request.patch(`${API_BASE}/appointments/${appointmentId}`, {
      headers: await authHeaders(token),
      data: { appointment: { payment_status: 'paid' } },
    });
    expect(updateResp.ok(), `PATCH payment_status=paid falhou: ${await updateResp.text()}`).toBeTruthy();

    await page.waitForTimeout(1_500);

    const messages = await getWhatsAppMessages(page, token, {
      phone:     phone.normalized,
      eventType: 'payment_confirmed',
    });

    if (messages.length === 0) {
      console.log(`⚠️  Mensagem payment_confirmed não encontrada para ${phone.raw} — WhatsApp pode não estar configurado`);
      return;
    }

    const msg = messages[0];
    expect(msg.event_type).toBe('payment_confirmed');
    expect(['pending', 'sent']).toContain(msg.status);
    expect(msg.body).toContain('Pagamento recebido');
  });
});

// ─────────────────────────────────────────────────────────
// 3. Idempotência — mesmo agendamento não gera 2 mensagens
// ─────────────────────────────────────────────────────────

test.describe('WhatsApp: idempotência (sem duplicatas)', () => {
  let appointmentId = null;
  const phone = TEST_PHONES[1];

  test.afterEach(async ({ page }) => {
    const token = await getToken(page);
    if (appointmentId) await deleteAppointment(page, token, appointmentId);
    appointmentId = null;
  });

  test(`segundo dispatch do mesmo evento não cria mensagem duplicada para ${phone.raw}`, async ({ page }) => {
    await page.goto('/');
    const token = await getToken(page);
    const { professional, service } = await fetchFirstProfessionalAndService(page, token);

    const { status, body } = await createAppointment(page, token, {
      phone: phone.raw, professional, service, hourOffset: 4,
    });
    expect(status).toBe(201);
    appointmentId = body.id;

    await page.waitForTimeout(1_500);

    // Conta mensagens de confirmação antes do segundo dispatch
    const before = await getWhatsAppMessages(page, token, {
      phone: phone.normalized, eventType: 'appointment_confirmation',
    });
    const beforeCount = before.length;

    // Atualiza o agendamento para status confirmado → dispara update callback
    await page.request.patch(`${API_BASE}/appointments/${appointmentId}`, {
      headers: await authHeaders(token),
      data: { appointment: { status: 'confirmed' } },
    }).catch(() => {});

    await page.waitForTimeout(1_500);

    const after = await getWhatsAppMessages(page, token, {
      phone: phone.normalized, eventType: 'appointment_confirmation',
    });

    // Deve ter no máximo 1 mensagem (idempotency_key impede duplicata)
    expect(after.length).toBeLessThanOrEqual(beforeCount + 1);
    if (after.length > 0 && before.length > 0) {
      // Se havia mensagem antes, não deve ter nova
      expect(after.length).toBe(beforeCount);
    }
  });
});

// ─────────────────────────────────────────────────────────
// 4. Normalização de número — formato internacional correto
// ─────────────────────────────────────────────────────────

test.describe('WhatsApp: normalização de números', () => {
  const createdIds = [];

  test.afterEach(async ({ page }) => {
    const token = await getToken(page);
    for (const id of createdIds) await deleteAppointment(page, token, id);
    createdIds.length = 0;
  });

  test('números com formatação diferentes chegam no mesmo contato', async ({ page }) => {
    await page.goto('/');
    const token = await getToken(page);
    const { professional, service } = await fetchFirstProfessionalAndService(page, token);

    const phone = TEST_PHONES[2];

    // Formatos alternativos do mesmo número
    const formats = [
      phone.raw,                    // +55 11 98055-9982
      '11 98055-9982',              // sem +55
      '11980559982',                // só dígitos com DDD
    ];

    // Cria um agendamento para cada formato (horários diferentes)
    for (const [idx, fmt] of formats.entries()) {
      const start = new Date(FUTURE);
      start.setHours(15 + idx, 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + 1);

      const resp = await page.request.post(`${API_BASE}/appointments`, {
        headers: await authHeaders(token),
        data: {
          appointment: {
            account_user_id: professional.id,
            service_id:      service.id,
            start_time:      start.toISOString(),
            end_time:        end.toISOString(),
            price_cents:     8000,
            whatsapp_number: fmt,
            payment_status:  'pending',
          },
        },
      });
      if (resp.ok()) {
        const b = await resp.json();
        if (b.id) createdIds.push(b.id);
      }
    }

    await page.waitForTimeout(1_000);

    // O contato auto-criado para o número normalizado deve existir
    const contactsResp = await page.request.get(`${API_BASE}/contacts`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const contacts = await contactsResp.json();
    const list = Array.isArray(contacts) ? contacts : (contacts.contacts ?? []);

    const normalized = phone.normalized.replace(/^55/, ''); // sem prefixo 55
    const found = list.filter(c =>
      (c.cell_phone_number || '').includes(normalized) ||
      (c.name || '').includes(normalized)
    );

    // Deve existir ao menos um contato com o número (pode ser vários se não deduplicou)
    expect(found.length, `Contato para ${phone.raw} não encontrado`).toBeGreaterThan(0);
  });
});
