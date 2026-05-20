const { chromium } = require('@playwright/test');
const fs = require('fs');

const BASE_URL  = 'https://orbiproject-front.dzkxmb.easypanel.host';
const EMAIL     = 'e2e_test@orbi.test';
const PASSWORD  = 'TestE2E@2026';
const AUTH_PATH = '/home/baby/Documents/BarberManagement/tests/performance/.auth/user.json';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page    = await context.newPage();

  // --- REGISTRO ---
  console.log('→ Abrindo login…');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });

  // Abrir formulário de cadastro
  await page.locator('button:has-text("Crie uma conta")').first().click();
  await page.waitForTimeout(600);

  console.log('→ Preenchendo cadastro…');
  await page.fill('#reg-account-name', 'Clínica E2E Teste');
  await page.fill('#reg-name', 'Teste E2E');
  await page.fill('#reg-email', EMAIL);
  await page.fill('#reg-password', PASSWORD);
  await page.fill('#reg-password-confirm', PASSWORD);

  // CPF/CNPJ se existir
  const docInput = page.locator('#reg-document');
  if (await docInput.count() > 0) {
    await docInput.fill('000.000.000-00');
  }

  // Aceitar termos se houver checkbox
  const termsChk = page.locator('input[type="checkbox"]').first();
  if (await termsChk.count() > 0) {
    const checked = await termsChk.isChecked();
    if (!checked) await termsChk.check();
  }

  // Screenshot antes de submeter
  await page.screenshot({ path: '/tmp/before_register.png' });

  // Botão de submit
  const submitBtn = page.locator('[data-testid="register-button"], button[type="submit"]:has-text("Criar"), button:has-text("Cadastrar"), button:has-text("Criar conta")').first();
  await submitBtn.click();
  console.log('→ Formulário submetido, aguardando resposta…');

  // Aguarda sair da página de login ou aparecer erro
  try {
    await page.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 15000 }
    );
    console.log('✅ Cadastro OK — URL:', page.url());
  } catch {
    const alert = await page.locator('[role="alert"], .error, [data-testid*="error"]').first().textContent().catch(() => '');
    console.log('⚠️  Ainda em /login. Mensagem:', alert || '(nenhuma)');
    await page.screenshot({ path: '/tmp/after_register_fail.png' });

    // Pode ser que o usuário já exista → tenta login direto
    console.log('→ Tentando login com as credenciais existentes…');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  }

  // --- LOGIN (em caso de cadastro ou usuário já existente) ---
  if (page.url().includes('/login')) {
    console.log('→ Fazendo login…');
    await page.fill('[data-testid="email-input"]', EMAIL);
    await page.fill('[data-testid="password-input"]', PASSWORD);
    await page.click('[data-testid="login-button"]');

    await page.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 20000 }
    );
    console.log('✅ Login OK — URL:', page.url());
  }

  // Salva estado de autenticação
  fs.mkdirSync('/home/baby/Documents/BarberManagement/tests/performance/.auth', { recursive: true });
  await context.storageState({ path: AUTH_PATH });
  console.log('✅ Auth state salvo em', AUTH_PATH);

  await browser.close();
})();
