// @ts-check
/**
 * SMOKE TESTS — Produção / Staging
 *
 * Cobre todos os casos de uso mapeados da plataforma orbi:
 * - Todas as rotas protegidas (autenticadas via storage state)
 * - Fluxos públicos (agendamento, vitrine, formulários)
 * - Verificação de carga sem erros de JS e sem redirect indevido para /login
 */
const { test, expect } = require('@playwright/test');

// ────────────────────────────────────────────────────────
// HELPER
// ────────────────────────────────────────────────────────

/** Navega, espera estabilizar e verifica que não caiu em /login */
async function smokeRoute(page, route, description) {
  const errors = [];
  const consoleListener = msg => { if (msg.type() === 'error') errors.push(msg.text()); };
  page.on('console', consoleListener);

  await page.goto(route);
  // Espera a Suspense/lazy load terminar (spinner desaparecer)
  await page.waitForLoadState('networkidle').catch(() => {});

  const url = page.url();
  const isOnLogin = url.includes('/login');

  page.off('console', consoleListener);

  // Filtrar erros de terceiros
  const appErrors = errors.filter(e =>
    !e.includes('extension') &&
    !e.includes('chrome-extension') &&
    !e.includes('favicon') &&
    !e.includes('ResizeObserver') &&
    !e.includes('Non-Error promise rejection')
  );

  return { url, isOnLogin, appErrors };
}

// ────────────────────────────────────────────────────────
// ROTAS PROTEGIDAS — core da aplicação
// ────────────────────────────────────────────────────────

test.describe('Dashboard e navegação principal', () => {
  test('/ — Dashboard carrega sem redirecionar para login', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/');
    expect(isOnLogin, 'Dashboard redirecionou para /login').toBe(false);
    expect(appErrors, `Erros de JS: ${appErrors.join(', ')}`).toHaveLength(0);
  });

  test('/profile — Perfil do usuário', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/profile');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });

  test('/settings — Configurações da conta', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/settings');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });

  test('/company-settings — Dados da empresa', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/company-settings');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });

  test('/subscription — Assinatura e plano', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/subscription');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });
});

test.describe('Agenda e atendimentos', () => {
  test('/appointments — Lista de agendamentos', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/appointments');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });

  test('/appointment-links — Links de agendamento público', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/appointment-links');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });

  test('/appointment-notes — Prontuários / notas de consulta', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/appointment-notes');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });

  test('/working-hours — Horários de atendimento', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/working-hours');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });
});

test.describe('Pacientes e contatos', () => {
  test('/contacts — Lista de pacientes/contatos', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/contacts');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });

  test('/anamnese — Templates de anamnese', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/anamnese');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });

  test('/document-templates — Templates de documentos', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/document-templates');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });
});

test.describe('Equipe e serviços', () => {
  test('/professionals — Gestão de profissionais', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/professionals');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });

  test('/services — Catálogo de serviços', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/services');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });

  test('/commissions — Comissões por profissional', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/commissions');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });
});

test.describe('Financeiro', () => {
  test('/transactions — Extrato e transações', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/transactions');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });

  test('/reports — Relatórios financeiros', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/reports');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });

  test('/reconciliations — Conciliações bancárias', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/reconciliations');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });
});

test.describe('Vitrine pública e descoberta', () => {
  test('/vitrine — Editar perfil público', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/vitrine');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });

  test('/imports — Importação de dados', async ({ page }) => {
    const { isOnLogin, appErrors } = await smokeRoute(page, '/imports');
    expect(isOnLogin).toBe(false);
    expect(appErrors).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────
// FLUXOS PÚBLICOS (sem autenticação necessária)
// ────────────────────────────────────────────────────────

test.describe('Páginas públicas', () => {
  test('/descobrir — Vitrine pública de profissionais', async ({ page }) => {
    await page.goto('/descobrir');
    await page.waitForLoadState('networkidle').catch(() => {});
    // Deve mostrar a página de descoberta, não um erro 404
    const title = await page.title();
    expect(title).not.toBe('');
    expect(page.url()).toContain('/descobrir');
  });

  test('/landing — Landing page do Orbi', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle').catch(() => {});
    const hero = page.locator('h1, h2').first();
    await expect(hero).toBeVisible({ timeout: 10_000 });
  });

  test('/landing-nutri — Landing page OrbiNutri', async ({ page }) => {
    await page.goto('/landing-nutri');
    await page.waitForLoadState('networkidle').catch(() => {});
    const hero = page.locator('h1, h2').first();
    await expect(hero).toBeVisible({ timeout: 10_000 });
  });
});

// ────────────────────────────────────────────────────────
// FLUXO DE AGENDAMENTO PÚBLICO (tok gerado automaticamente)
// ────────────────────────────────────────────────────────

test.describe('API de saúde', () => {
  test('health_check responde OK', async ({ request }) => {
    const res = await request.get(
      'https://orbiproject-orbiapp.dzkxmb.easypanel.host/health_check'
    );
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.db).toBe(true);
    expect(body.cache).toBe(true);
  });
});
