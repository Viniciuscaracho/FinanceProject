/**
 * Testes de Performance - Agendamentos
 * 
 * Verifica performance da página de agendamentos
 */

import { test, expect } from '@playwright/test';

test.describe('Appointments Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@exemplo.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/');
  });

  test('Calendário deve carregar rapidamente', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/appointments');
    await page.waitForSelector('[data-testid="appointments-calendar"]', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
    console.log(`Calendário carregou em ${loadTime}ms`);
  });

  test('Modal de criação deve abrir rapidamente', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    await page.click('[data-testid="new-appointment-button"]');
    await page.waitForSelector('[data-testid="appointment-modal"]', { timeout: 2000 });
    const openTime = Date.now() - startTime;
    
    expect(openTime).toBeLessThan(500);
    console.log(`Modal abriu em ${openTime}ms`);
  });

  test('Navegação entre meses deve ser rápida', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    await page.click('[data-testid="month-next"]');
    await page.waitForLoadState('networkidle');
    const navigationTime = Date.now() - startTime;
    
    expect(navigationTime).toBeLessThan(1000);
    console.log(`Navegação de mês em ${navigationTime}ms`);
  });

  test('Busca de agendamentos deve ser rápida', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    await page.fill('[data-testid="appointment-search"]', 'teste');
    await page.waitForTimeout(500); // Debounce
    await page.waitForLoadState('networkidle');
    const searchTime = Date.now() - startTime;
    
    expect(searchTime).toBeLessThan(1500);
    console.log(`Busca executada em ${searchTime}ms`);
  });
});

