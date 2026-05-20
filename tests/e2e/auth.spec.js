// @ts-check
const { test, expect } = require('@playwright/test');

const API = 'https://orbiproject-orbiapp.dzkxmb.easypanel.host/api/v1';

// Usuário de teste fixo (já criado em staging, gmail passa pela validação Mailgun)
// Senha: test123456 — criado manualmente em sessão anterior
const LOGIN_EMAIL    = 'viniciuscaracho77+nutritest@gmail.com';
const LOGIN_PASSWORD = 'test123456';

// Para registro, usa alias Gmail +e2e_TIMESTAMP para garantir email "novo" aceito pelo Mailgun
const RUN_ID = Date.now();
const REG_EMAIL_BASE = `viniciuscaracho77+e2e_${RUN_ID}`;

async function apiRegister(email, password = LOGIN_PASSWORD, name = 'E2E Tester') {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text, status: res.status }; }
}

// Verifica que o usuário de login existe (já pre-criado em staging)
test.beforeAll(async () => {
  const res = await fetch(`${API}/auth/login_simple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(`Usuário de teste não encontrado em staging. Rode: POST /api/v1/auth/register com email=${LOGIN_EMAIL}`);
  }
});

// ────────────────────────────────────────────────────────
// REGISTRO (UI)
// ────────────────────────────────────────────────────────
test.describe('Registro', () => {
  test('usuário consegue criar conta e entra no dashboard', async ({ page }) => {
    const email = `${REG_EMAIL_BASE}@gmail.com`;

    await page.goto('/login');
    await expect(page.getByTestId('login-page')).toBeVisible();

    await page.getByRole('button', { name: /crie uma conta/i }).click();
    await expect(page.locator('#reg-name')).toBeVisible();

    await page.locator('#reg-name').fill('E2E Tester');
    await page.locator('#reg-email').fill(email);
    await page.getByTestId('reg-password-input').fill(LOGIN_PASSWORD);
    await page.getByTestId('reg-password-confirm-input').fill(LOGIN_PASSWORD);

    await page.getByTestId('register-button').click();

    // Mailgun call em staging pode levar alguns segundos; aguarda até 25s para sair do /login
    await expect(page).not.toHaveURL(/login/, { timeout: 25_000 });
  });

  test('exibe erro para senha curta (menos de 6 caracteres)', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /crie uma conta/i }).click();

    await page.locator('#reg-name').fill('Teste');
    await page.locator('#reg-email').fill(`${REG_EMAIL_BASE}_short@gmail.com`);
    await page.getByTestId('reg-password-input').fill('123');
    await page.getByTestId('reg-password-confirm-input').fill('123');
    await page.getByTestId('register-button').click();

    await expect(page).toHaveURL(/login/);
  });

  test('exibe erro para senhas que não coincidem', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /crie uma conta/i }).click();

    await page.locator('#reg-name').fill('Teste');
    await page.locator('#reg-email').fill(`${REG_EMAIL_BASE}_mismatch@gmail.com`);
    await page.getByTestId('reg-password-input').fill(LOGIN_PASSWORD);
    await page.getByTestId('reg-password-confirm-input').fill('Diferente@2026');
    await page.getByTestId('register-button').click();

    await expect(page).toHaveURL(/login/);
  });
});

// ────────────────────────────────────────────────────────
// LOGIN (UI)
// ────────────────────────────────────────────────────────
test.describe('Login', () => {
  test('entra com credenciais corretas e vai para o dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByTestId('email-input').fill(LOGIN_EMAIL);
    await page.getByTestId('password-input').fill(LOGIN_PASSWORD);

    await Promise.all([
      page.waitForURL(/\/(dashboard|$)/, { timeout: 15_000 }),
      page.getByTestId('login-button').click(),
    ]);

    await expect(page).not.toHaveURL(/login/);
  });

  test('exibe erro para credenciais inválidas', async ({ page }) => {
    await page.goto('/login');

    await page.getByTestId('email-input').fill(LOGIN_EMAIL);
    await page.getByTestId('password-input').fill('senhaerrada');
    await page.getByTestId('login-button').click();

    await expect(page).toHaveURL(/login/);
    await expect(page.getByTestId('login-page')).toBeVisible();
  });

  test('usuário já logado é redirecionado para fora do /login', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByTestId('email-input').fill(LOGIN_EMAIL);
    await page.getByTestId('password-input').fill(LOGIN_PASSWORD);
    await page.getByTestId('login-button').click();
    await page.waitForURL(/\/(dashboard|$)/, { timeout: 15_000 });

    // Tenta voltar para /login — deve ser redirecionado
    await page.goto('/login');
    await expect(page).not.toHaveURL(/login/);
  });
});
