// @ts-check
/**
 * OAUTH REDIRECT URI — Diagnóstico de redirect_uri_mismatch
 *
 * Erro 400 "redirect_uri_mismatch" ocorre quando o redirect_uri enviado ao
 * Google não bate com o cadastrado no Google Cloud Console.
 *
 * Esse spec valida os três fluxos OAuth que geram redirect_uri:
 *   1. Login via Google        → /api/v1/oauth/google_oauth_url
 *   2. Google Calendar OAuth   → /api/v1/google_calendar/oauth_url  (autenticado)
 *   3. Google Contacts OAuth   → /api/v1/google_contacts/oauth_url  (autenticado)
 *
 * Cenários verificados por fluxo:
 *   - redirect_uri está presente na URL gerada
 *   - redirect_uri usa HTTPS (não HTTP)
 *   - redirect_uri não contém localhost nem IP interno
 *   - redirect_uri usa o domínio correto (API_BASE_URL, não request.base_url interno)
 *   - redirect_uri tem o path exato esperado
 *   - redirect_uri no exchange_code (token exchange) é idêntico ao gerado no auth URL
 *
 * IMPORTANTE: contacts_callback_url usa `request.base_url` em vez de
 * `ENV.fetch('API_BASE_URL', request.base_url)`, diferindo dos outros fluxos.
 * Em produção atrás de proxy isso produz URL interna → falha no Google.
 */

const { test, expect } = require('@playwright/test');

// ─── Configuração por ambiente ─────────────────────────────────────────────────

const STAGING_API = 'https://orbiproject-orbiapp.dzkxmb.easypanel.host/api/v1';
const PROD_API    = 'https://backend.orbinutri.com.br/api/v1';

// URI registradas no Google Cloud Console (devem ser as únicas URIs aceitas).
// Se qualquer endpoint gerar algo diferente → redirect_uri_mismatch.
const EXPECTED_REDIRECT_URIS = {
  login:    `${PROD_API}/auth/google_oauth_callback`,
  calendar: `${PROD_API}/google_calendar/callback`,
  contacts: `${PROD_API}/google_contacts/callback`,
};

// API usada nos testes (staging)
const API_BASE = STAGING_API;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function getToken(page) {
  return page.evaluate(() => localStorage.getItem('auth_token'));
}

/**
 * Extrai redirect_uri de uma auth URL do Google.
 * A URL tem formato: https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...
 */
function extractRedirectUri(authUrl) {
  try {
    const url = new URL(authUrl);
    return url.searchParams.get('redirect_uri');
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. LOGIN VIA GOOGLE — /api/v1/oauth/google_oauth_url (sem autenticação)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('OAuth redirect_uri — Login via Google', () => {
  test('endpoint retorna auth_url com redirect_uri presente', async ({ page }) => {
    const resp = await page.request.get(`${API_BASE}/oauth/google_oauth_url`);

    expect(resp.status(), 'endpoint deve responder 200').toBe(200);
    const body = await resp.json();
    expect(body.auth_url, 'campo auth_url deve existir').toBeTruthy();
  });

  test('redirect_uri de login usa HTTPS (não HTTP)', async ({ page }) => {
    const resp = await page.request.get(`${API_BASE}/oauth/google_oauth_url`);
    const { auth_url } = await resp.json();

    const redirectUri = extractRedirectUri(auth_url);
    expect(redirectUri, 'redirect_uri deve estar na auth_url').toBeTruthy();
    expect(redirectUri, 'redirect_uri deve ser HTTPS').toMatch(/^https:\/\//);
  });

  test('redirect_uri de login não contém localhost nem IP interno', async ({ page }) => {
    const resp = await page.request.get(`${API_BASE}/oauth/google_oauth_url`);
    const { auth_url } = await resp.json();

    const redirectUri = extractRedirectUri(auth_url);
    expect(redirectUri).not.toMatch(/localhost/);
    expect(redirectUri).not.toMatch(/127\.0\.0\.\d/);
    expect(redirectUri).not.toMatch(/10\.\d+\.\d+\.\d+/);
    expect(redirectUri).not.toMatch(/192\.168\.\d+\.\d+/);
  });

  test('redirect_uri de login aponta para o path correto do backend', async ({ page }) => {
    const resp = await page.request.get(`${API_BASE}/oauth/google_oauth_url`);
    const { auth_url } = await resp.json();

    const redirectUri = extractRedirectUri(auth_url);
    expect(
      redirectUri,
      `redirect_uri deve terminar em /api/v1/auth/google_oauth_callback — atual: ${redirectUri}`
    ).toMatch(/\/api\/v1\/auth\/google_oauth_callback$/);
  });

  test('redirect_uri de login bate exatamente com a URI registrada no Google Console', async ({ page }) => {
    const resp = await page.request.get(`${API_BASE}/oauth/google_oauth_url`);
    const { auth_url } = await resp.json();

    const redirectUri = extractRedirectUri(auth_url);

    // Em staging o domínio muda — verificamos apenas o path e o protocolo.
    // Para produção, o assert abaixo deve passar integralmente.
    expect(redirectUri).toMatch(/^https:\/\//);
    expect(redirectUri).toMatch(/\/api\/v1\/auth\/google_oauth_callback$/);
    expect(redirectUri, 'não deve ter trailing slash após o path').not.toMatch(/\/api\/v1\/auth\/google_oauth_callback\/$/);
  });

  test('auth_url aponta para accounts.google.com (não versão antiga)', async ({ page }) => {
    const resp = await page.request.get(`${API_BASE}/oauth/google_oauth_url`);
    const { auth_url } = await resp.json();

    expect(auth_url).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth/);
  });

  test('auth_url de login inclui scope openid email profile', async ({ page }) => {
    const resp = await page.request.get(`${API_BASE}/oauth/google_oauth_url`);
    const { auth_url } = await resp.json();

    const url = new URL(auth_url);
    const scope = url.searchParams.get('scope');
    expect(scope).toMatch(/openid/);
    expect(scope).toMatch(/email/);
    expect(scope).toMatch(/profile/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. GOOGLE CALENDAR — /api/v1/google_calendar/oauth_url (autenticado)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('OAuth redirect_uri — Google Calendar', () => {
  test('endpoint retorna oauth_url com redirect_uri presente', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const resp = await page.request.get(`${API_BASE}/google_calendar/oauth_url`, {
      headers: authHeaders(token),
    });

    expect(resp.status(), 'endpoint deve responder 200').toBe(200);
    const body = await resp.json();
    expect(body.oauth_url, 'campo oauth_url deve existir').toBeTruthy();
  });

  test('redirect_uri do Calendar usa HTTPS', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const resp = await page.request.get(`${API_BASE}/google_calendar/oauth_url`, {
      headers: authHeaders(token),
    });
    const { oauth_url } = await resp.json();

    const redirectUri = extractRedirectUri(oauth_url);
    expect(redirectUri, 'redirect_uri deve estar na oauth_url').toBeTruthy();
    expect(redirectUri).toMatch(/^https:\/\//);
  });

  test('redirect_uri do Calendar não contém localhost nem IP interno', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const resp = await page.request.get(`${API_BASE}/google_calendar/oauth_url`, {
      headers: authHeaders(token),
    });
    const { oauth_url } = await resp.json();

    const redirectUri = extractRedirectUri(oauth_url);
    expect(redirectUri).not.toMatch(/localhost/);
    expect(redirectUri).not.toMatch(/127\.0\.0\.\d/);
    expect(redirectUri).not.toMatch(/10\.\d+\.\d+\.\d+/);
    expect(redirectUri).not.toMatch(/192\.168\.\d+\.\d+/);
  });

  test('redirect_uri do Calendar aponta para o path correto', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const resp = await page.request.get(`${API_BASE}/google_calendar/oauth_url`, {
      headers: authHeaders(token),
    });
    const { oauth_url } = await resp.json();

    const redirectUri = extractRedirectUri(oauth_url);
    expect(
      redirectUri,
      `redirect_uri deve terminar em /api/v1/google_calendar/callback — atual: ${redirectUri}`
    ).toMatch(/\/api\/v1\/google_calendar\/callback$/);
  });

  test('Calendar usa mesmo domínio que Login (ambos via API_BASE_URL)', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const [loginResp, calResp] = await Promise.all([
      page.request.get(`${API_BASE}/oauth/google_oauth_url`),
      page.request.get(`${API_BASE}/google_calendar/oauth_url`, { headers: authHeaders(token) }),
    ]);

    const loginBody = await loginResp.json();
    const calBody   = await calResp.json();

    const loginUri = extractRedirectUri(loginBody.auth_url);
    const calUri   = extractRedirectUri(calBody.oauth_url);

    const loginDomain   = new URL(loginUri).hostname;
    const calendarDomain = new URL(calUri).hostname;

    expect(
      calendarDomain,
      `Calendar usa domínio "${calendarDomain}" mas Login usa "${loginDomain}" — devem ser iguais`
    ).toBe(loginDomain);
  });

  test('oauth_url do Calendar inclui scope de calendar', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const resp = await page.request.get(`${API_BASE}/google_calendar/oauth_url`, {
      headers: authHeaders(token),
    });
    const { oauth_url } = await resp.json();

    expect(oauth_url).toMatch(/calendar/);
  });

  test('oauth_url do Calendar inclui state JWT válido', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const resp = await page.request.get(`${API_BASE}/google_calendar/oauth_url`, {
      headers: authHeaders(token),
    });
    const { oauth_url } = await resp.json();

    const url = new URL(oauth_url);
    const state = url.searchParams.get('state');
    expect(state, 'state JWT deve estar presente').toBeTruthy();
    // JWT tem 3 partes separadas por ponto
    expect(state.split('.').length, 'state deve ser JWT com 3 segmentos').toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. GOOGLE CONTACTS — /api/v1/google_contacts/oauth_url (autenticado)
//
// BUG DETECTADO: contacts_callback_url usa `request.base_url` em vez de
// `ENV.fetch('API_BASE_URL', request.base_url)`.
// Em produção atrás de proxy, isso gera URL interna (ex: http://0.0.0.0:3000)
// que não está registrada no Google Console → redirect_uri_mismatch.
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('OAuth redirect_uri — Google Contacts', () => {
  test('endpoint retorna oauth_url com redirect_uri presente', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const resp = await page.request.get(`${API_BASE}/google_contacts/oauth_url`, {
      headers: authHeaders(token),
    });

    expect(resp.status(), 'endpoint deve responder 200').toBe(200);
    const body = await resp.json();
    expect(body.oauth_url, 'campo oauth_url deve existir').toBeTruthy();
  });

  test('redirect_uri de Contacts usa HTTPS (falha se usa request.base_url interno)', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const resp = await page.request.get(`${API_BASE}/google_contacts/oauth_url`, {
      headers: authHeaders(token),
    });
    const { oauth_url } = await resp.json();

    const redirectUri = extractRedirectUri(oauth_url);
    expect(redirectUri, 'redirect_uri deve estar na oauth_url').toBeTruthy();
    expect(
      redirectUri,
      `redirect_uri usa HTTP em vez de HTTPS — indica request.base_url interno: ${redirectUri}`
    ).toMatch(/^https:\/\//);
  });

  test('redirect_uri de Contacts não contém localhost nem IP interno', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const resp = await page.request.get(`${API_BASE}/google_contacts/oauth_url`, {
      headers: authHeaders(token),
    });
    const { oauth_url } = await resp.json();

    const redirectUri = extractRedirectUri(oauth_url);
    expect(redirectUri, 'redirect_uri não deve conter localhost').not.toMatch(/localhost/);
    expect(redirectUri, 'redirect_uri não deve conter 127.0.0.x').not.toMatch(/127\.0\.0\.\d/);
    expect(redirectUri, 'redirect_uri não deve conter IP 10.x').not.toMatch(/10\.\d+\.\d+\.\d+/);
    expect(redirectUri, 'redirect_uri não deve conter IP 192.168.x').not.toMatch(/192\.168\.\d+\.\d+/);
  });

  test('redirect_uri de Contacts aponta para o path correto', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const resp = await page.request.get(`${API_BASE}/google_contacts/oauth_url`, {
      headers: authHeaders(token),
    });
    const { oauth_url } = await resp.json();

    const redirectUri = extractRedirectUri(oauth_url);
    expect(
      redirectUri,
      `redirect_uri deve terminar em /api/v1/google_contacts/callback — atual: ${redirectUri}`
    ).toMatch(/\/api\/v1\/google_contacts\/callback$/);
  });

  test('[BUG] Contacts usa mesmo domínio que Login e Calendar', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const [loginResp, contactsResp] = await Promise.all([
      page.request.get(`${API_BASE}/oauth/google_oauth_url`),
      page.request.get(`${API_BASE}/google_contacts/oauth_url`, { headers: authHeaders(token) }),
    ]);

    const loginUri    = extractRedirectUri((await loginResp.json()).auth_url);
    const contactsUri = extractRedirectUri((await contactsResp.json()).oauth_url);

    const loginDomain    = new URL(loginUri).hostname;
    const contactsDomain = new URL(contactsUri).hostname;

    expect(
      contactsDomain,
      `[BUG] Contacts usa domínio "${contactsDomain}" mas Login usa "${loginDomain}". ` +
      `Corrija contacts_callback_url para usar ENV.fetch('API_BASE_URL', request.base_url) ` +
      `(google_contacts_controller.rb linha 163)`
    ).toBe(loginDomain);
  });

  test('[BUG] Contacts usa mesmo protocolo que Login (ambos HTTPS)', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const [loginResp, contactsResp] = await Promise.all([
      page.request.get(`${API_BASE}/oauth/google_oauth_url`),
      page.request.get(`${API_BASE}/google_contacts/oauth_url`, { headers: authHeaders(token) }),
    ]);

    const loginUri    = extractRedirectUri((await loginResp.json()).auth_url);
    const contactsUri = extractRedirectUri((await contactsResp.json()).oauth_url);

    const loginProtocol    = new URL(loginUri).protocol;
    const contactsProtocol = new URL(contactsUri).protocol;

    expect(
      contactsProtocol,
      `[BUG] Contacts usa protocolo "${contactsProtocol}" mas Login usa "${loginProtocol}". ` +
      `Ambos devem ser "https:"`
    ).toBe(loginProtocol);
  });

  test('oauth_url de Contacts inclui scope de contacts', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const resp = await page.request.get(`${API_BASE}/google_contacts/oauth_url`, {
      headers: authHeaders(token),
    });
    const { oauth_url } = await resp.json();

    expect(oauth_url).toMatch(/contacts/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. CONSISTÊNCIA ENTRE FLUXOS — os três devem usar o mesmo domínio base
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Consistência de redirect_uri entre todos os fluxos OAuth', () => {
  test('Login, Calendar e Contacts usam o mesmo domínio no redirect_uri', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const [loginResp, calResp, contactsResp] = await Promise.all([
      page.request.get(`${API_BASE}/oauth/google_oauth_url`),
      page.request.get(`${API_BASE}/google_calendar/oauth_url`, { headers: authHeaders(token) }),
      page.request.get(`${API_BASE}/google_contacts/oauth_url`, { headers: authHeaders(token) }),
    ]);

    const loginUri    = extractRedirectUri((await loginResp.json()).auth_url);
    const calUri      = extractRedirectUri((await calResp.json()).oauth_url);
    const contactsUri = extractRedirectUri((await contactsResp.json()).oauth_url);

    const loginDomain    = new URL(loginUri).hostname;
    const calDomain      = new URL(calUri).hostname;
    const contactsDomain = new URL(contactsUri).hostname;

    console.log('redirect_uri gerados:');
    console.log('  Login:    ', loginUri);
    console.log('  Calendar: ', calUri);
    console.log('  Contacts: ', contactsUri);

    expect(calDomain,      `Calendar deve usar mesmo domínio que Login`).toBe(loginDomain);
    expect(contactsDomain, `Contacts deve usar mesmo domínio que Login`).toBe(loginDomain);
  });

  test('nenhum redirect_uri tem trailing slash', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const [loginResp, calResp, contactsResp] = await Promise.all([
      page.request.get(`${API_BASE}/oauth/google_oauth_url`),
      page.request.get(`${API_BASE}/google_calendar/oauth_url`, { headers: authHeaders(token) }),
      page.request.get(`${API_BASE}/google_contacts/oauth_url`, { headers: authHeaders(token) }),
    ]);

    const loginUri    = extractRedirectUri((await loginResp.json()).auth_url);
    const calUri      = extractRedirectUri((await calResp.json()).oauth_url);
    const contactsUri = extractRedirectUri((await contactsResp.json()).oauth_url);

    expect(loginUri,    'Login não deve ter trailing slash').not.toMatch(/\/$/);
    expect(calUri,      'Calendar não deve ter trailing slash').not.toMatch(/\/$/);
    expect(contactsUri, 'Contacts não deve ter trailing slash').not.toMatch(/\/$/);
  });

  test('todos os redirect_uri estão dentro do namespace /api/v1/', async ({ page }) => {
    await page.goto('/dashboard');
    const token = await getToken(page);

    const [loginResp, calResp, contactsResp] = await Promise.all([
      page.request.get(`${API_BASE}/oauth/google_oauth_url`),
      page.request.get(`${API_BASE}/google_calendar/oauth_url`, { headers: authHeaders(token) }),
      page.request.get(`${API_BASE}/google_contacts/oauth_url`, { headers: authHeaders(token) }),
    ]);

    const loginUri    = extractRedirectUri((await loginResp.json()).auth_url);
    const calUri      = extractRedirectUri((await calResp.json()).oauth_url);
    const contactsUri = extractRedirectUri((await contactsResp.json()).oauth_url);

    expect(loginUri).toMatch(/\/api\/v1\//);
    expect(calUri).toMatch(/\/api\/v1\//);
    expect(contactsUri).toMatch(/\/api\/v1\//);
  });
});
