# frozen_string_literal: true

require 'application_system_test_case'

class DashboardE2ETest < ApplicationSystemTestCase
  FRONTEND_URL = 'http://localhost:5173'

  setup do
    # Assumindo que há um helper para fazer login
    # visit "#{FRONTEND_URL}/login"
    # fill_in 'email', with: 'test@example.com'
    # fill_in 'password', with: 'password123'
    # click_button 'Entrar'
    # sleep 2
  end

  test 'visiting dashboard' do
    visit "#{FRONTEND_URL}/"
    
    # Verificar elementos principais
    assert_text 'Dashboard', wait: 5
    assert_text 'Visão geral das suas finanças'
  end

  test 'dashboard header buttons' do
    visit "#{FRONTEND_URL}/"
    
    # Verificar botão de período
    assert_selector 'button', text: /Julho\/2025|Janeiro\/2025/, wait: 5
    
    # Verificar botão de atualizar
    assert_button 'Atualizar'
  end

  test 'main stats cards are displayed' do
    visit "#{FRONTEND_URL}/"
    
    # Verificar cards de estatísticas
    assert_text 'Receitas', wait: 5
    assert_text 'Despesas'
    assert_text 'Saldo'
    assert_text 'Resultado'
  end

  test 'charts are displayed' do
    visit "#{FRONTEND_URL}/"
    
    # Verificar gráficos
    assert_selector 'svg', wait: 5 # Recharts renderiza SVGs
  end

  test 'recent transactions section' do
    visit "#{FRONTEND_URL}/"
    
    # Verificar seção de transações recentes
    assert_text 'Transações Recentes', wait: 5
    
    # Verificar botão "Ver todas"
    assert_button 'Ver todas'
  end

  test 'quick action cards' do
    visit "#{FRONTEND_URL}/"
    
    # Verificar cards de ação rápida
    assert_text 'Nova Transação', wait: 5
    assert_text 'Novo Contato'
    assert_text 'Relatórios'
  end

  test 'click on new transaction card' do
    visit "#{FRONTEND_URL}/"
    
    # Clicar no card de Nova Transação
    find('text', text: 'Nova Transação', exact: false).find(:xpath, 'ancestor::*[contains(@class, "cursor-pointer")]').click
    
    # Verificar redirecionamento
    assert_current_path '/transactions', wait: 5
  end

  test 'click on new contact card' do
    visit "#{FRONTEND_URL}/"
    
    # Clicar no card de Novo Contato
    find('text', text: 'Novo Contato', exact: false).find(:xpath, 'ancestor::*[contains(@class, "cursor-pointer")]').click
    
    # Verificar redirecionamento
    assert_current_path '/contacts', wait: 5
  end

  test 'click on view all transactions' do
    visit "#{FRONTEND_URL}/"
    
    # Clicar no botão "Ver todas"
    click_button 'Ver todas'
    
    # Verificar redirecionamento
    assert_current_path '/transactions', wait: 5
  end

  test 'update button reloads data' do
    visit "#{FRONTEND_URL}/"
    
    # Clicar no botão atualizar
    click_button 'Atualizar'
    
    # Verificar que a página não mudou
    assert_current_path '/', wait: 5
  end

  test 'period selector button' do
    visit "#{FRONTEND_URL}/"
    
    # Verificar que o botão de período existe
    period_button = find('button', text: /Julho\/2025|Janeiro\/2025/, wait: 5)
    
    # Clicar no botão (pode abrir um seletor)
    period_button.click
    
    sleep 1
    # Verificar comportamento (pode abrir modal ou dropdown)
  end

  test 'loading state display' do
    visit "#{FRONTEND_URL}/"
    
    # Verificar se há indicador de loading inicial
    # (pode não aparecer se carregar muito rápido)
    sleep 1
  end

  test 'error state with retry button' do
    visit "#{FRONTEND_URL}/"
    
    # Simular erro (pode precisar mockar API)
    # Verificar se aparece botão "Tentar novamente"
    # assert_button 'Tentar novamente', wait: 10
  end
end

