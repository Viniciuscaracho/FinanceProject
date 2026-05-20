// @ts-check
const { test, expect } = require('@playwright/test');

const API = 'https://orbiproject-orbiapp.dzkxmb.easypanel.host/api/v1';

// Único email de login reutilizado por toda a suite (criado uma vez via API)
const LOGIN_EMAIL    = `e2e_login_fixed@gmail.com`;
const LOGIN_PASSWORD = 'TestE2E@2026';

async function apiRegister(email, password = LOGIN_PASSWORD, name = 'E2E Tester') {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text, status: res.status }; }
}

// Garante que o usuário de login existe antes da suite inteira
test.beforeAll(async () => {
  const result = await apiRegister(LOGIN_EMAIL);
  // Aceita tanto sucesso quanto "e-mail já cadastrado"
  if (!result.success && !result.error?.includes('já está cadastrado')) {
    throw new Error(`Falha ao criar usuário de teste: ${JSON.stringify(result)}`);
  }
});

// ────────────────────────────────────────────────────────
// REGISTRO (UI)
// ────────────────────────────────────────────────────────
test.describe('Registro', () => {
  // Email único por run para não colidir com runs anteriores
  const RUN_ID = Date.now();

  test('usuário consegue criar conta e entra no dashboard', async ({ page }) => {
    const email = `e2e_reg_${RUN_ID}@gmail.com`;

    await page.goto('/login');
    await expect(page.getByTestId('login-page')).toBeVisible();

    await page.getByRole('button', { name: /crie uma conta/i }).click();
    await expect(page.locator('#reg-name')).toBeVisible();

    await page.locator('#reg-name').fill('E2E Tester');
    await page.locator('#reg-email').fill(email);
    await page.getByTestId('password-input').nth(0).fill(LOGIN_PASSWORD);
    await page.getByTestId('password-input').nth(1).fill(LOGIN_PASSWORD);

    await Promise.all([
      page.waitForURL(/\/(dashboard|$)/, { timeout: 15_000 }),
      page.getByTestId('register-button').click(),
    ]);

    await expect(page).not.toHaveURL(/login/);
  });

  test('exibe erro para senha curta (menos de 6 caracteres)', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /crie uma conta/i }).click();

    await page.locator('#reg-name').fill('Teste');
    await page.locator('#reg-email').fill(`fail_short_${RUN_ID}@gmail.com`);
    await page.getByTestId('password-input').nth(0).fill('123');
    await page.getByTestId('password-input').nth(1).fill('123');
    await page.getByTestId('register-button').click();

    // Permanece na tela de cadastro
    await expect(page).toHaveURL(/login/);
  });

  test('exibe erro para senhas que não coincidem', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /crie uma conta/i }).click();

    await page.locator('#reg-name').fill('Teste');
    await page.locator('#reg-email').fill(`fail_mismatch_${RUN_ID}@gmail.com`);
    await page.getByTestId('password-input').nth(0).fill(LOGIN_PASSWORD);
    await page.getByTestId('password-input').nth(1).fill('Diferente@2026');
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
