/**
 * Testes de Performance - Dashboard
 * 
 * Verifica métricas de performance do dashboard usando Playwright
 * 
 * Execução:
 * npx playwright test dashboard.performance.spec.js --project=performance
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@exemplo.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/');
  });

  test('Dashboard deve carregar em menos de 2 segundos', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
    console.log(`Dashboard carregou em ${loadTime}ms`);
  });

  test('Métricas do dashboard devem aparecer rapidamente', async ({ page }) => {
    await page.goto('/');
    
    // Medir tempo até métricas aparecerem
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="revenue-card"]', { timeout: 5000 });
    const metricsTime = Date.now() - startTime;
    
    expect(metricsTime).toBeLessThan(1000);
    console.log(`Métricas apareceram em ${metricsTime}ms`);
  });

  test('Gráficos devem renderizar sem erros', async ({ page }) => {
    await page.goto('/');
    
    // Verificar se gráficos estão presentes
    const charts = await page.locator('[data-testid="monthly-chart"], [data-testid="category-chart"]').count();
    expect(charts).toBeGreaterThan(0);
    
    // Verificar se não há erros no console
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000); // Aguardar renderização
    
    expect(errors.length).toBe(0);
  });

  test('Filtros devem responder rapidamente', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Medir tempo de resposta ao mudar filtro
    const startTime = Date.now();
    await page.click('[data-testid="filter-week"]');
    await page.waitForLoadState('networkidle');
    const filterTime = Date.now() - startTime;
    
    expect(filterTime).toBeLessThan(1500);
    console.log(`Filtro aplicado em ${filterTime}ms`);
  });

  test('Exportação de relatório deve iniciar rapidamente', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    await page.click('[data-testid="export-button"]');
    
    // Aguardar início do download ou confirmação
    await page.waitForTimeout(500);
    const exportTime = Date.now() - startTime;
    
    expect(exportTime).toBeLessThan(1000);
    console.log(`Exportação iniciou em ${exportTime}ms`);
  });

  test('Performance Lighthouse - Dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Executar Lighthouse via CDP
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    
    await page.waitForLoadState('networkidle');
    
    const metrics = await client.send('Performance.getMetrics');
    
    // Extrair métricas importantes
    const navigationStart = metrics.metrics.find(m => m.name === 'NavigationStart')?.value || 0;
    const domContentLoaded = metrics.metrics.find(m => m.name === 'DomContentLoaded')?.value || 0;
    const loadComplete = metrics.metrics.find(m => m.name === 'Load')?.value || 0;
    
    const domContentLoadedTime = domContentLoaded - navigationStart;
    const loadTime = loadComplete - navigationStart;
    
    console.log(`DOM Content Loaded: ${domContentLoadedTime}ms`);
    console.log(`Load Complete: ${loadTime}ms`);
    
    // Assertions baseadas em métricas
    expect(domContentLoadedTime).toBeLessThan(2000);
    expect(loadTime).toBeLessThan(3000);
  });

  test('Memory usage deve ser razoável', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Obter uso de memória
    const memory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
        };
      }
      return null;
    });
    
    if (memory) {
      const usedMB = memory.used / 1024 / 1024;
      console.log(`Memória usada: ${usedMB.toFixed(2)} MB`);
      
      // Verificar se não está usando mais de 100MB
      expect(usedMB).toBeLessThan(100);
    }
  });
});

