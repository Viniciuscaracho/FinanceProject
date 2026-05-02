/**
 * Testes E2E - Login
 * 
 * Testes end-to-end da funcionalidade de login
 */

import { test, expect } from '@playwright/test';

test.describe('Login E2E', () => {
  test('Login com credenciais válidas', async ({ page }) => {
    await page.goto('/login');
    
    // Verificar elementos da página
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    
    // Preencher formulário
    await page.fill('[data-testid="email-input"]', 'admin@exemplo.com');
    await page.fill('[data-testid="password-input"]', 'password');
    
    // Submeter
    await page.click('[data-testid="login-button"]');
    
    // Verificar redirecionamento
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
    
    // Verificar que está logado (presença de elementos do dashboard)
    await expect(page.locator('[data-testid="dashboard-metrics"]')).toBeVisible({ timeout: 5000 });
  });

  test('Login com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Verificar mensagem de erro
    await expect(page.locator('text=/erro|inválido|incorreto/i')).toBeVisible({ timeout: 3000 });
    
    // Verificar que não foi redirecionado
    await expect(page).toHaveURL(/\/login/);
  });

  test('Validação de campos obrigatórios', async ({ page }) => {
    await page.goto('/login');
    
    // Tentar submeter sem preencher
    await page.click('[data-testid="login-button"]');
    
    // Verificar mensagens de validação
    await expect(page.locator('text=/obrigatório|required/i').first()).toBeVisible({ timeout: 2000 });
  });

  test('Validação de formato de email', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', 'email-invalido');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    // Verificar mensagem de erro de formato
    await expect(page.locator('text=/email|formato/i')).toBeVisible({ timeout: 2000 });
  });
});

