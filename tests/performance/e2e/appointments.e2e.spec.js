/**
 * Testes E2E - Agendamentos
 * 
 * Testes end-to-end completos da funcionalidade de agendamentos
 */

import { test, expect } from '@playwright/test';

test.describe('Appointments E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@exemplo.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/');
  });

  test('Criar novo agendamento', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    
    // Clicar em novo agendamento
    await page.click('[data-testid="new-appointment-button"]');
    await page.waitForSelector('[data-testid="appointment-modal"]');
    
    // Preencher formulário
    await page.fill('[data-testid="contact-name-input"]', 'Cliente Teste');
    await page.fill('[data-testid="contact-phone-input"]', '+5511999999999');
    
    // Selecionar profissional (se houver select)
    const professionalSelect = page.locator('[data-testid="professional-select"]');
    if (await professionalSelect.count() > 0) {
      await professionalSelect.click();
      await page.locator('[role="option"]').first().click();
    }
    
    // Selecionar serviço
    const serviceSelect = page.locator('[data-testid="service-select"]');
    if (await serviceSelect.count() > 0) {
      await serviceSelect.click();
      await page.locator('[role="option"]').first().click();
    }
    
    // Selecionar data (próximo dia disponível)
    await page.click('[data-testid="date-picker"]');
    await page.locator('[role="gridcell"]:not([aria-disabled="true"])').first().click();
    
    // Selecionar horário
    const timeSlots = page.locator('[data-testid="time-slot"]:not([disabled])');
    if (await timeSlots.count() > 0) {
      await timeSlots.first().click();
    }
    
    // Salvar
    await page.click('[data-testid="save-appointment-button"]');
    
    // Verificar sucesso
    await expect(page.locator('text=/sucesso|agendamento criado/i')).toBeVisible({ timeout: 5000 });
    
    // Verificar que modal fechou
    await expect(page.locator('[data-testid="appointment-modal"]')).not.toBeVisible({ timeout: 2000 });
  });

  test('Visualizar detalhes de agendamento', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    
    // Clicar em um agendamento
    const appointment = page.locator('[data-testid="appointment-item"]').first();
    if (await appointment.count() > 0) {
      await appointment.click();
      
      // Verificar modal de detalhes
      await expect(page.locator('[data-testid="appointment-detail-modal"]')).toBeVisible({ timeout: 3000 });
      
      // Verificar informações exibidas
      await expect(page.locator('text=/cliente|profissional|serviço/i')).toBeVisible();
    }
  });

  test('Editar agendamento', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    
    // Abrir detalhes
    const appointment = page.locator('[data-testid="appointment-item"]').first();
    if (await appointment.count() > 0) {
      await appointment.click();
      await page.waitForSelector('[data-testid="appointment-detail-modal"]');
      
      // Clicar em editar
      await page.click('[data-testid="edit-appointment-button"]');
      
      // Modificar dados
      await page.fill('[data-testid="contact-name-input"]', 'Cliente Editado');
      
      // Salvar
      await page.click('[data-testid="save-appointment-button"]');
      
      // Verificar sucesso
      await expect(page.locator('text=/sucesso|atualizado/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Cancelar agendamento', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    
    // Abrir detalhes
    const appointment = page.locator('[data-testid="appointment-item"]').first();
    if (await appointment.count() > 0) {
      await appointment.click();
      await page.waitForSelector('[data-testid="appointment-detail-modal"]');
      
      // Clicar em cancelar
      await page.click('[data-testid="cancel-appointment-button"]');
      
      // Confirmar cancelamento
      await page.waitForSelector('[data-testid="confirm-dialog"]');
      await page.click('[data-testid="confirm-button"]');
      
      // Verificar sucesso
      await expect(page.locator('text=/cancelado|sucesso/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Filtrar agendamentos por profissional', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    
    // Abrir filtros
    await page.click('[data-testid="filters-button"]');
    
    // Selecionar profissional
    const professionalFilter = page.locator('[data-testid="professional-filter"]');
    if (await professionalFilter.count() > 0) {
      await professionalFilter.click();
      await page.locator('[role="option"]').first().click();
      
      // Aplicar filtro
      await page.click('[data-testid="apply-filters-button"]');
      
      // Verificar que lista foi atualizada
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="appointment-item"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Navegar entre meses no calendário', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');
    
    // Ir para próximo mês
    await page.click('[data-testid="month-next"]');
    await page.waitForLoadState('networkidle');
    
    // Verificar que calendário atualizou
    await expect(page.locator('[data-testid="appointments-calendar"]')).toBeVisible();
    
    // Voltar para mês anterior
    await page.click('[data-testid="month-prev"]');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('[data-testid="appointments-calendar"]')).toBeVisible();
  });
});

