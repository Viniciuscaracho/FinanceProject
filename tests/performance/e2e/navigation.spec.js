import { test, expect } from '@playwright/test';

const skipIfNoAuth = () => {
  if (!process.env.TEST_USER_EMAIL) {
    test.skip(true, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD para rodar testes autenticados');
  }
};

const PROTECTED_ROUTES = [
  { path: '/',                 label: 'Dashboard'     },
  { path: '/appointments',     label: 'Agendamentos'  },
  { path: '/contacts',         label: 'Contatos'      },
  { path: '/transactions',     label: 'Transações'    },
  { path: '/professionals',    label: 'Profissionais' },
  { path: '/services',         label: 'Serviços'      },
];

test.describe('Navegação entre páginas protegidas', () => {
  test.beforeEach(skipIfNoAuth);

  for (const { path, label } of PROTECTED_ROUTES) {
    test(`${label} (${path}) carrega sem erro`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Não deve redirecionar para login
      await expect(page).not.toHaveURL(/\/login/);

      // Não deve mostrar tela de erro
      await expect(
        page.locator('text=/erro de conexão|something went wrong|500/i')
      ).toHaveCount(0);

      // A página deve ter conteúdo visível
      await expect(page.locator('body')).not.toBeEmpty();
    });
  }
});

test.describe('Sidebar / menu lateral', () => {
  test.beforeEach(skipIfNoAuth);

  test('link para Agendamentos navega corretamente', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.click('a[href="/appointments"]');
    await expect(page).toHaveURL('/appointments');
    await expect(page.locator('[data-testid="appointments-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('link para Transações navega corretamente', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.click('a[href="/transactions"]');
    await expect(page).toHaveURL('/transactions');
  });
});

test.describe('Breadcrumb / título de página', () => {
  test.beforeEach(skipIfNoAuth);

  test('Dashboard exibe o título no document', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // O título do documento deve conter algo relevante
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('Login exibe o título correto', async ({ page }) => {
    // Este não precisa de auth
    await page.context().clearCookies();
    await page.goto('/login');
    const title = await page.title();
    expect(title).toMatch(/login|orbi/i);
  });
});
