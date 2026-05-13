import { test, expect } from '@playwright/test';

const hasCredentials = !!(process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD);

test.describe('Login', () => {
  test('exibe campos de email, senha e botão', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });

  test('exibe erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'naoexiste@teste.com');
    await page.fill('[data-testid="password-input"]', 'senhaerrada123');
    await page.click('[data-testid="login-button"]');

    await expect(
      page.locator('[role="alert"]').first()
    ).toBeVisible({ timeout: 8000 });

    await expect(page).toHaveURL(/\/login/);
  });

  test('não submete sem preencher os campos', async ({ page }) => {
    await page.goto('/login');
    await page.click('[data-testid="login-button"]');
    // Navegador valida campo required antes de submeter — ainda em /login
    await expect(page).toHaveURL(/\/login/);
  });

  test.describe('Login com credenciais válidas', () => {
    test.skip(!hasCredentials, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD para rodar este teste');

    test('redireciona para o dashboard após login', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', process.env.TEST_USER_EMAIL);
      await page.fill('[data-testid="password-input"]', process.env.TEST_USER_PASSWORD);
      await page.click('[data-testid="login-button"]');

      await page.waitForURL('/', { timeout: 15000 });
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
    });
  });
});

test.describe('Registro', () => {
  test('mostra o formulário de cadastro ao clicar em "Crie uma conta"', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Crie uma conta")');

    await expect(page.locator('[data-testid="register-button"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="estabelecimento"], input[id="reg-account-name"]')).toBeVisible();
  });

  test('valida que as senhas devem coincidir', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Crie uma conta")');

    await page.fill('input[id="reg-account-name"]', 'Barbearia Teste');
    await page.fill('input[id="reg-name"]', 'Fulano Silva');
    await page.fill('input[id="reg-email"]', 'novo@teste.com');
    await page.fill('[data-testid="reg-password-input"]', 'senha123');
    await page.fill('[data-testid="reg-password-confirm-input"]', 'outrasenha456');
    await page.click('[data-testid="register-button"]');

    await expect(page.locator('text=/senhas não coincidem/i')).toBeVisible({ timeout: 3000 });
  });

  test('volta para login ao clicar em "Faça login"', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Crie uma conta")');
    await page.click('button:has-text("Faça login")');

    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });
});

test.describe('Roteamento protegido', () => {
  test('redireciona para /login ao tentar acessar rota protegida sem auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });

  test('redireciona para /login ao tentar acessar /appointments sem auth', async ({ page }) => {
    await page.goto('/appointments');
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});

test.describe('Logout', () => {
  test.skip(!hasCredentials, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD para rodar este teste');

  test('desloga e redireciona para login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', process.env.TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', process.env.TEST_USER_PASSWORD);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/', { timeout: 15000 });

    await page.click('[data-testid="logout-menu-item"]');
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});
