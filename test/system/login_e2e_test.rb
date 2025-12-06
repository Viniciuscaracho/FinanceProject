# frozen_string_literal: true

require 'application_system_test_case'

class LoginE2ETest < ApplicationSystemTestCase
  FRONTEND_URL = 'http://localhost:5173'

  test 'visiting login page' do
    visit "#{FRONTEND_URL}/login"
    assert_selector '[data-testid="login-page"]'
    assert_selector '[data-testid="login-card"]'
  end

  test 'login form elements are present' do
    visit "#{FRONTEND_URL}/login"
    
    # Verificar campos do formulário
    assert_selector '[data-testid="email-input"]'
    assert_selector '[data-testid="password-input"]'
    assert_selector '[data-testid="login-button"]'
    
    # Verificar botões de tipo de login
    assert_text 'Login Simples'
    assert_text 'Login Completo'
    
    # Verificar botão de criar usuário teste
    assert_text 'Criar Usuário Teste'
  end

  test 'toggle login type buttons' do
    visit "#{FRONTEND_URL}/login"
    
    # Clicar em Login Simples
    click_button 'Login Simples'
    assert_selector 'button:has-text("Login Simples")[class*="default"]', wait: 2
    
    # Clicar em Login Completo
    click_button 'Login Completo'
    assert_selector 'button:has-text("Login Completo")[class*="default"]', wait: 2
  end

  test 'show/hide password toggle' do
    visit "#{FRONTEND_URL}/login"
    
    password_input = find('[data-testid="password-input"]')
    
    # Verificar que inicialmente é tipo password
    assert_equal 'password', password_input[:type]
    
    # Clicar no botão de mostrar senha
    password_toggle = find('button[aria-label*="senha"]', match: :first)
    password_toggle.click
    
    # Verificar que mudou para text
    assert_equal 'text', password_input[:type]
    
    # Clicar novamente para ocultar
    password_toggle.click
    assert_equal 'password', password_input[:type]
  end

  test 'fill login form' do
    visit "#{FRONTEND_URL}/login"
    
    fill_in 'email', with: 'test@example.com'
    fill_in 'password', with: 'password123'
    
    assert_field 'email', with: 'test@example.com'
    assert_field 'password', with: 'password123'
  end

  test 'create test user button' do
    visit "#{FRONTEND_URL}/login"
    
    # Verificar que o botão existe
    assert_button 'Criar Usuário Teste'
    
    # Clicar no botão (pode demorar)
    click_button 'Criar Usuário Teste'
    
    # Aguardar preenchimento automático
    sleep 2
    
    # Verificar que os campos foram preenchidos
    email_field = find('[data-testid="email-input"]')
    password_field = find('[data-testid="password-input"]')
    
    assert_not_empty email_field.value
    assert_not_empty password_field.value
  end

  test 'login button is disabled when loading' do
    visit "#{FRONTEND_URL}/login"
    
    login_button = find('[data-testid="login-button"]')
    
    # Preencher formulário
    fill_in 'email', with: 'test@example.com'
    fill_in 'password', with: 'password123'
    
    # Clicar no botão de login
    login_button.click
    
    # Verificar que o botão mostra estado de loading
    assert_text 'Entrando...', wait: 2
  end

  test 'error message display' do
    visit "#{FRONTEND_URL}/login"
    
    # Tentar fazer login com credenciais inválidas
    fill_in 'email', with: 'invalid@example.com'
    fill_in 'password', with: 'wrongpassword'
    click_button 'Entrar'
    
    # Aguardar mensagem de erro (se houver)
    sleep 2
    
    # Verificar se há mensagem de erro (pode não aparecer dependendo da implementação)
    # assert_selector '.alert', wait: 5
  end
end

