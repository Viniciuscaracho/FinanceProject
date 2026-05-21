// @ts-check
/**
 * MOBILE RESPONSIVENESS TESTS
 *
 * Detecta overflow horizontal em cada rota autenticada.
 * Roda em 2 viewports:
 *   - Pixel 5  (393px) — via playwright.config project
 *   - iPhone SE (375px) — emulado via page.setViewportSize
 */
const { test, expect } = require('@playwright/test');

// Páginas autenticadas a serem testadas
const PAGES = [
  { name: 'Dashboard',        url: '/' },
  { name: 'Agendamentos',     url: '/appointments' },
  { name: 'Pacientes',        url: '/contacts' },
  { name: 'Transações',       url: '/transactions' },
  { name: 'Comissões',        url: '/commissions' },
  { name: 'Serviços',         url: '/services' },
  { name: 'Profissionais',    url: '/professionals' },
  { name: 'Horários',         url: '/working-hours' },
  { name: 'Link de Agenda',   url: '/appointment-links' },
  { name: 'Relatórios',       url: '/reports' },
  { name: 'Configurações',    url: '/settings' },
  { name: 'Vitrine',          url: '/vitrine' },
];

// Detecta elementos com overflow horizontal real
async function findOverflowingElements(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const results = [];

    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      // Ignora elementos ocultos, muito pequenos ou sem largura
      if (rect.width === 0 || rect.height === 0) return;
      // Ignora body e html (que podem ter scroll intencional)
      if (el.tagName === 'BODY' || el.tagName === 'HTML') return;
      // Ignora elementos posicionados absolutos fora do fluxo
      const style = getComputedStyle(el);
      if (style.position === 'fixed') return;

      const rightEdge = Math.round(rect.right);
      if (rightEdge > vw + 2) { // margem de 2px para antialiasing
        results.push({
          tag:        el.tagName.toLowerCase(),
          id:         el.id || null,
          classes:    (el.className?.toString() || '').split(' ').filter(Boolean).slice(0, 4).join(' '),
          rightEdge,
          overflow:   rightEdge - vw,
          width:      Math.round(rect.width),
          text:       (el.textContent || '').trim().slice(0, 60),
        });
      }
    });

    // Retorna os 8 piores offenders (maior overflow primeiro)
    return results
      .sort((a, b) => b.overflow - a.overflow)
      .slice(0, 8);
  });
}

// Verifica overflow no documento inteiro
async function pageHasHorizontalOverflow(page) {
  return page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
  );
}

// ─────────────────────────────────────────────────────────
// Helper: checa overflow e reporta no console
// ─────────────────────────────────────────────────────────

async function checkPage(page, name, url) {
  await page.goto(url);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(600);

  const vw = await page.evaluate(() => window.innerWidth);
  const hasOverflow = await pageHasHorizontalOverflow(page);
  const offenders   = hasOverflow ? await findOverflowingElements(page) : [];

  if (offenders.length > 0) {
    console.log(`\n⚠️  OVERFLOW [${vw}px] em "${name}" (${url}):`);
    offenders.forEach(el => {
      console.log(`  <${el.tag}${el.id ? '#' + el.id : ''} .${el.classes}>`);
      console.log(`    → direita: ${el.rightEdge}px (${el.overflow}px fora) | texto: "${el.text}"`);
    });
  } else {
    console.log(`  ✓ [${vw}px] ${name} — sem overflow`);
  }

  return { hasOverflow, offenders, vw };
}

// ─────────────────────────────────────────────────────────
// Suite 1: viewport Pixel 5 (393px) — definido no playwright.config
// ─────────────────────────────────────────────────────────

test.describe('Pixel 5 — 393px', () => {
  for (const pg of PAGES) {
    test(`${pg.name}`, async ({ page }) => {
      const { hasOverflow, offenders } = await checkPage(page, pg.name, pg.url);
      expect(
        hasOverflow,
        `"${pg.name}" tem overflow em 393px.\n` +
        (offenders[0] ? `Pior elemento: <${offenders[0].tag} class="${offenders[0].classes}"> (${offenders[0].overflow}px fora)` : '')
      ).toBe(false);
    });
  }
});

// ─────────────────────────────────────────────────────────
// Suite 2: viewport 375px (iPhone SE — tela mais estreita comum)
// ─────────────────────────────────────────────────────────

test.describe('iPhone SE — 375px', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  for (const pg of PAGES) {
    test(`${pg.name}`, async ({ page }) => {
      const { hasOverflow, offenders } = await checkPage(page, pg.name, pg.url);
      expect(
        hasOverflow,
        `"${pg.name}" tem overflow em 375px.\n` +
        (offenders[0] ? `Pior elemento: <${offenders[0].tag} class="${offenders[0].classes}"> (${offenders[0].overflow}px fora)` : '')
      ).toBe(false);
    });
  }
});

// ─────────────────────────────────────────────────────────
// Suite 3: interações que revelam conteúdo adicional
// ─────────────────────────────────────────────────────────

test.describe('Conteúdo interativo — 375px', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('Agendamentos — aba Lista (tabela com dados)', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Troca para a aba lista (mostra tabela com colunas)
    const listTab = page.getByRole('tab', { name: /lista/i });
    if (await listTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await listTab.click();
      await page.waitForTimeout(500);
    }

    const { hasOverflow, offenders } = await checkPage(page, 'Agendamentos (Lista)', '/appointments');
    expect(
      hasOverflow,
      `Aba Lista tem overflow.\n` +
      (offenders[0] ? `Pior: <${offenders[0].tag} .${offenders[0].classes}> ${offenders[0].overflow}px` : '')
    ).toBe(false);
  });

  test('Serviços — abre dialog de novo serviço', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle').catch(() => {});

    const btn = page.getByTestId('new-service-btn');
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(400);
    }

    const { hasOverflow, offenders } = await checkPage(page, 'Serviços (dialog aberto)', '/services');
    expect(hasOverflow, offenders[0] ? `Dialog overflow: ${offenders[0].overflow}px` : '').toBe(false);
  });

  test('Pacientes — abre dialog de novo paciente', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle').catch(() => {});

    const btn = page.getByTestId('new-contact-btn');
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(400);
    }

    const { hasOverflow, offenders } = await checkPage(page, 'Pacientes (dialog aberto)', '/contacts');
    expect(hasOverflow, offenders[0] ? `Dialog overflow: ${offenders[0].overflow}px` : '').toBe(false);
  });
});
