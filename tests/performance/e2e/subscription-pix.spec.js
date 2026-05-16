import { test, expect } from '@playwright/test';

/**
 * Testes E2E para o fluxo PIX na página /subscription.
 *
 * Toda chamada à API do backend é interceptada via page.route(),
 * portanto estes testes NÃO precisam de AbacatePay real nem de webhook público.
 *
 * Os testes que acessam páginas autenticadas requerem as variáveis:
 *   TEST_USER_EMAIL / TEST_USER_PASSWORD (para o globalSetup gerar o storageState)
 * ou são marcados com test.skip quando não estão disponíveis.
 */

const skipIfNoAuth = () => {
  if (!process.env.TEST_USER_EMAIL) {
    test.skip(true, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD para rodar testes autenticados');
  }
};

const PLAN_FIXTURE = {
  id: 'price_basic_test',
  product_id: 'prod_basic_test',
  name: 'Plano Básico',
  description: 'Plano mensal para barbearias',
  amount: 4900,
  currency: 'brl',
  interval: 'month',
  interval_count: 1,
  metadata: {},
};

const PIX_BILLING_FIXTURE = {
  billing_url: 'https://abacatepay.com/pay/bill_e2e_test_001',
  billing_id: 'bill_e2e_test_001',
  status: 'PENDING',
};

/**
 * Intercepta todas as chamadas de API necessárias para renderizar
 * a página /subscription sem uma assinatura ativa.
 */
async function mockSubscriptionApis(page, overrides = {}) {
  await page.route('**/api/v1/subscriptions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.subscription ?? { subscription: null, subscribed: false }),
    });
  });

  await page.route('**/api/v1/subscriptions/plans', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ plans: overrides.plans ?? [PLAN_FIXTURE] }),
    });
  });

  await page.route('**/api/v1/pix_payments/create_billing', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.pixBilling ?? PIX_BILLING_FIXTURE),
    });
  });
}

// ── Testes que não precisam de auth real (usam mock completo) ─────────────────

test.describe('Página /subscription — PIX (sem auth real)', () => {
  test('exibe botão "Pagar via PIX" para cada plano disponível', async ({ page }) => {
    skipIfNoAuth();
    await mockSubscriptionApis(page);
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    const pixBtn = page.locator('button', { hasText: /pagar via pix/i });
    await expect(pixBtn).toBeVisible({ timeout: 10000 });
  });

  test('botão "Pagar via PIX" dispara request para create_billing com dados corretos', async ({ page }) => {
    skipIfNoAuth();

    // Registrar subscriptions/plans antes — create_billing será capturado via waitForRequest
    await mockSubscriptionApis(page);

    // Intercepta navegação para abacatepay para que a página não saia
    await page.route('https://abacatepay.com/**', (route) => route.fulfill({ status: 200, body: 'mock' }));

    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    const pixBtn = page.locator('button', { hasText: /pagar via pix/i }).first();
    await expect(pixBtn).toBeVisible({ timeout: 10000 });

    // Captura a request via waitForRequest (independente de route handlers)
    const requestPromise = page.waitForRequest('**/api/v1/pix_payments/create_billing', { timeout: 5000 });
    await pixBtn.click();
    const request = await requestPromise;

    const body = JSON.parse(request.postData() || '{}');
    expect(body.plan_name).toBeDefined();
    expect(body.amount).toBeGreaterThan(0);
    expect(body.frequency).toBe('ONE_TIME');
  });

  test('botão "Pagar via PIX" fica disabled durante o carregamento', async ({ page }) => {
    skipIfNoAuth();

    await mockSubscriptionApis(page);

    // Registrado DEPOIS do mockSubscriptionApis — Playwright usa LIFO, então este vence
    await page.route('**/api/v1/pix_payments/create_billing', async (route) => {
      // Mantém o request pendente indefinidamente para checar estado de loading
      await new Promise(() => {});
    });

    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    const pixBtn = page.locator('button', { hasText: /pagar via pix/i }).first();
    await expect(pixBtn).toBeVisible({ timeout: 10000 });

    await pixBtn.click();

    // Durante o loading deve aparecer "Gerando PIX..."
    await expect(page.locator('button', { hasText: /gerando pix/i })).toBeVisible({ timeout: 3000 });
  });

  test('exibe erro toast quando API do PIX retorna falha', async ({ page }) => {
    skipIfNoAuth();
    await page.route('**/api/v1/subscriptions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ subscription: null, subscribed: false }),
      });
    });
    await page.route('**/api/v1/subscriptions/plans', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ plans: [PLAN_FIXTURE] }),
      });
    });
    await page.route('**/api/v1/pix_payments/create_billing', async (route) => {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'AbacatePay não configurado' }),
      });
    });

    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    const pixBtn = page.locator('button', { hasText: /pagar via pix/i }).first();
    await expect(pixBtn).toBeVisible({ timeout: 10000 });
    await pixBtn.click();

    // Toast de erro deve aparecer
    await expect(page.locator('[data-sonner-toast]').or(page.locator('[role="alert"]'))).toBeVisible({ timeout: 5000 });
  });

  test('não exibe botão PIX quando já existe assinatura ativa', async ({ page }) => {
    skipIfNoAuth();
    await mockSubscriptionApis(page, {
      subscription: {
        subscription: {
          id: 1,
          processor_id: 'bill_active_pix',
          status: 'active',
          name: 'Conta - Plano Básico',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
          plan: { id: 'price_basic_test', nickname: 'Plano Básico', product: 'prod_basic' },
        },
        subscribed: true,
      },
    });

    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    // Com assinatura ativa, o botão PIX não deve aparecer
    await expect(page.locator('button', { hasText: /pagar via pix/i })).toHaveCount(0);
  });

  test('exibe mensagem de sucesso ao retornar com ?pix_success=true', async ({ page }) => {
    skipIfNoAuth();
    await mockSubscriptionApis(page);

    await page.goto('/subscription?pix_success=true');
    await page.waitForLoadState('networkidle');

    // Toast de sucesso do PIX
    const toastOrAlert = page.locator('[data-sonner-toast]').or(page.locator('[role="alert"]'));
    await expect(toastOrAlert.filter({ hasText: /pix/i })).toBeVisible({ timeout: 5000 });

    // URL deve ser limpa
    await expect(page).not.toHaveURL(/pix_success/);
  });

  test('página /subscription carrega sem erros com planos e sem assinatura', async ({ page }) => {
    skipIfNoAuth();
    await mockSubscriptionApis(page);

    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);

    await expect(page.getByText('Plano Básico').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button', { hasText: /cartão|boleto/i })).toBeVisible({ timeout: 8000 });
    await expect(page.locator('button', { hasText: /pagar via pix/i })).toBeVisible({ timeout: 8000 });
  });
});
