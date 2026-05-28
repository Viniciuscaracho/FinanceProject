/**
 * Verify: NutrientPanel + FoodSearch tabs + targets modal
 * Runs against local dev server (localhost:5173 → API :3000)
 */
const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';
const EMAIL = 'admin@exemplo.com';
const PASSWORD = 'password123';
const CONTACT_ID = 203;
const PLAN_ID = 1;
const SHOTS = '/tmp';

async function shot(page, name) {
  const p = `${SHOTS}/nutri-${name}.png`;
  await page.screenshot({ path: p, fullPage: false });
  console.log(`  📸 ${p}`);
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const ctx  = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // ── 1. Login ────────────────────────────────────────────────────────────
  console.log('\n=== 1. Login ===');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await shot(page, '01-login');

  const emailInput = page.locator('input[type="email"], input[data-testid="email-input"], input[placeholder*="mail"]').first();
  const passInput  = page.locator('input[type="password"]').first();
  await emailInput.fill(EMAIL);
  await passInput.fill(PASSWORD);
  await shot(page, '02-filled');
  await passInput.press('Enter');

  try {
    await page.waitForURL(/\/(dashboard|contacts|$)/, { timeout: 10000 });
    console.log('  ✅ Login OK — URL:', page.url());
  } catch {
    console.log('  ⚠️  URL after login:', page.url());
  }
  await shot(page, '03-after-login');

  // ── 2. Navegar para o MealPlanBuilder ──────────────────────────────────
  console.log('\n=== 2. MealPlanBuilder ===');
  await page.goto(`${BASE}/contacts/${CONTACT_ID}/meal-plans/${PLAN_ID}`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await shot(page, '04-meal-plan-loaded');

  const title = await page.locator('h1').first().textContent().catch(() => '(not found)');
  console.log('  Plan title:', title);

  // Verificar se os dias estão presentes
  const dayCards = await page.locator('text=Segunda-feira, text=Café da manhã').count().catch(() => 0);
  const mealCards = await page.locator('text=Café da manhã').count();
  console.log('  "Café da manhã" visible:', mealCards > 0 ? '✅' : '❌');

  // ── 3. Painel de nutrientes ────────────────────────────────────────────
  console.log('\n=== 3. Painel de nutrientes ===');
  const analysisBtn = page.locator('button:has-text("Análise de nutrientes")').first();
  const hasAnalysis = await analysisBtn.count();
  console.log('  "Análise de nutrientes" button:', hasAnalysis > 0 ? '✅ presente' : '❌ não encontrado');

  if (hasAnalysis > 0) {
    await analysisBtn.click();
    await page.waitForTimeout(500);
    await shot(page, '05-nutrient-panel-open');
    // Check for donut chart
    const hasSvg = await page.locator('svg').count();
    console.log('  SVG charts rendered:', hasSvg > 0 ? `✅ (${hasSvg} svgs)` : '❌');
    // Check density gauge
    const hasDensity = await page.locator('text=/Densidade calórica/i').count();
    console.log('  Gauge "Densidade calórica":', hasDensity > 0 ? '✅' : '❌');
  }

  // ── 4. Painel do cardápio diário ───────────────────────────────────────
  console.log('\n=== 4. Painel do cardápio (DayNutrientPanel) ===');
  const dayPanelBtn = page.locator('button:has-text("Análise de nutrientes do cardápio")').first();
  const hasDayPanel = await dayPanelBtn.count();
  console.log('  Painel diário:', hasDayPanel > 0 ? '✅ presente' : '❌ não encontrado');

  if (hasDayPanel > 0) {
    await shot(page, '06-day-panel');
    // Verificar tabela Prescrito × Teórico
    const hasTeoricoHeader = await page.locator('text=Teórico').count();
    console.log('  Coluna "Teórico":', hasTeoricoHeader > 0 ? '✅' : '❌');
  }

  // ── 5. Metas (TargetsModal) ────────────────────────────────────────────
  console.log('\n=== 5. Modal de metas diárias ===');
  const metasBtn = page.locator('button:has-text("Metas")').first();
  const hasMetasBtn = await metasBtn.count();
  console.log('  Botão "Metas":', hasMetasBtn > 0 ? '✅' : '❌');

  if (hasMetasBtn > 0) {
    await metasBtn.click();
    await page.waitForTimeout(400);
    await shot(page, '07-targets-modal');

    const hasKcalField = await page.locator('text=Calorias (Kcal)').count();
    console.log('  Campo "Calorias (Kcal)":', hasKcalField > 0 ? '✅' : '❌');

    // Preencher metas
    const inputs = page.locator('input[type="number"]');
    const count = await inputs.count();
    if (count >= 5) {
      await inputs.nth(0).fill('2000'); // kcal
      await inputs.nth(1).fill('150');  // protein
      await inputs.nth(2).fill('220');  // carbs
      await inputs.nth(3).fill('65');   // fat
      await inputs.nth(4).fill('30');   // fiber
      await shot(page, '08-targets-filled');
      console.log('  Metas preenchidas ✅');

      const saveBtn = page.locator('button:has-text("Salvar")').last();
      await saveBtn.click();
      await page.waitForTimeout(1000);
      await shot(page, '09-targets-saved');
      const metaChip = await page.locator('text=/2000 kcal/').count();
      console.log('  Meta salva visível no header:', metaChip > 0 ? '✅' : '(aguardando render)');
    }
  }

  // ── 6. Busca de alimentos — tabs ──────────────────────────────────────
  console.log('\n=== 6. FoodSearch com tabs ===');
  await page.goto(`${BASE}/contacts/${CONTACT_ID}/meal-plans/${PLAN_ID}`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);

  const addFoodBtn = page.locator('button:has-text("Adicionar alimento")').first();
  const hasAddBtn = await addFoodBtn.count();
  console.log('  Botão "Adicionar alimento":', hasAddBtn > 0 ? '✅' : '❌');

  if (hasAddBtn > 0) {
    await addFoodBtn.click();
    await page.waitForTimeout(500);
    await shot(page, '10-food-search-modal');

    // Verificar tabs
    for (const tab of ['Todos', 'TACO', 'Fabricantes', 'Meus alimentos']) {
      const exists = await page.locator(`button:has-text("${tab}")`).count();
      console.log(`  Tab "${tab}":`, exists > 0 ? '✅' : '❌');
    }

    // Verificar botão de barcode
    const barcodeBtn = await page.locator('[title="Buscar por código de barras"]').count();
    console.log('  Botão barcode:', barcodeBtn > 0 ? '✅' : '❌');

    // Buscar "arroz" na aba TACO
    const tacoTab = page.locator('button:has-text("TACO")').first();
    await tacoTab.click();
    await page.waitForTimeout(200);

    const searchInput = page.locator('input[placeholder*="Buscar alimento"]').first();
    await searchInput.fill('arroz');
    await page.waitForTimeout(800);
    await shot(page, '11-food-search-taco');

    const results = await page.locator('button').filter({ hasText: 'Arroz' }).count();
    console.log('  Resultados "arroz" na TACO:', results > 0 ? `✅ (${results} encontrados)` : '❌');

    // Testar aba Fabricantes
    const fabTab = page.locator('button:has-text("Fabricantes")').first();
    await fabTab.click();
    await page.waitForTimeout(200);
    const searchInput2 = page.locator('input[placeholder*="Buscar em fabricantes"]').first();
    const fabPlaceholder = await searchInput2.count();
    console.log('  Placeholder "Fabricantes" na busca:', fabPlaceholder > 0 ? '✅' : '❌ (placeholder não mudou)');

    await shot(page, '12-food-search-fabricantes');

    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  // ── 7. API: verificar endpoint barcode ────────────────────────────────
  console.log('\n=== 7. API — /foods e /foods/barcode ===');
  // Test via fetch na página (já autenticada)
  const apiResult = await page.evaluate(async () => {
    try {
      const base = window.location.origin.replace('5173','3000').replace('localhost:5173', 'localhost:3000');
      // Tenta pegar token do localStorage
      const keys = Object.keys(localStorage);
      const tokenKey = keys.find(k => k.toLowerCase().includes('token') || k.toLowerCase().includes('auth'));
      const token = tokenKey ? localStorage.getItem(tokenKey) : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const r = await fetch('/api/v1/foods?q=arroz&source=taco', { headers });
      const d = await r.json();
      return { status: r.status, count: (d.foods || []).length };
    } catch(e) { return { error: e.message }; }
  });
  console.log('  GET /foods?q=arroz&source=taco:', JSON.stringify(apiResult));

  console.log('\n=== ✅ Verificação concluída ===');
  console.log('Screenshots em /tmp/nutri-*.png');

  await browser.close();
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
