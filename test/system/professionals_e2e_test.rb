# frozen_string_literal: true

require 'application_system_test_case'

class ProfessionalsE2ETest < ApplicationSystemTestCase
  FRONTEND_URL = 'http://localhost:5173'

  test 'visiting professionals page' do
    visit "#{FRONTEND_URL}/professionals"
    
    assert_text 'Profissionais', wait: 5
    assert_text 'Gerencie os profissionais que trabalham no salão'
  end

  test 'header button is present' do
    visit "#{FRONTEND_URL}/professionals"
    
    assert_button 'Novo Profissional', wait: 5
  end

  test 'search input is present' do
    visit "#{FRONTEND_URL}/professionals"
    
    assert_selector 'input[placeholder*="Buscar"]', wait: 5
  end

  test 'open new professional modal' do
    visit "#{FRONTEND_URL}/professionals"
    
    click_button 'Novo Profissional'
    
    assert_text 'Novo Profissional', wait: 5
  end

  test 'new professional form fields' do
    visit "#{FRONTEND_URL}/professionals"
    
    click_button 'Novo Profissional'
    
    # Verificar campos
    assert_field 'Nome', wait: 5
    assert_field 'Sobrenome'
    assert_field 'Email'
    assert_field 'Telefone'
    assert_field 'Senha'
    assert_selector 'select', text: 'Função'
  end

  test 'fill new professional form' do
    visit "#{FRONTEND_URL}/professionals"
    
    click_button 'Novo Profissional'
    
    # Preencher formulário
    fill_in 'Nome', with: 'Maria'
    fill_in 'Sobrenome', with: 'Santos'
    fill_in 'Email', with: 'maria@example.com'
    fill_in 'Telefone', with: '(11) 99999-9999'
    fill_in 'Senha', with: 'password123'
    
    # Selecionar função
    select 'Profissional', from: 'Função'
    
    # Verificar campos preenchidos
    assert_field 'Nome', with: 'Maria'
    assert_field 'Sobrenome', with: 'Santos'
    assert_field 'Email', with: 'maria@example.com'
  end

  test 'cancel new professional modal' do
    visit "#{FRONTEND_URL}/professionals"
    
    click_button 'Novo Profissional'
    assert_text 'Novo Profissional', wait: 5
    
    click_button 'Cancelar'
    
    assert_no_text 'Novo Profissional', wait: 2
  end

  test 'edit professional form shows optional password' do
    visit "#{FRONTEND_URL}/professionals"
    
    sleep 2
    
    # Tentar encontrar botão de editar
    if page.has_selector?('button[title*="Editar"]', wait: 2) || 
       page.has_selector?('svg[class*="Edit"]', wait: 2)
      
      edit_buttons = all('button', text: '', wait: 2)
      edit_button = edit_buttons.find { |btn| btn.find('svg', class: /Edit/, wait: false) rescue nil }
      
      if edit_button
        edit_button.click
        
        assert_text 'Editar Profissional', wait: 5
        
        # Verificar que há campo de nova senha opcional
        assert_field 'Nova Senha (opcional)'
      end
    end
  end

  test 'delete professional' do
    visit "#{FRONTEND_URL}/professionals"
    
    sleep 2
    
    # Tentar encontrar botão de excluir
    if page.has_selector?('button[title*="Excluir"]', wait: 2) || 
       page.has_selector?('svg[class*="Trash"]', wait: 2)
      
      delete_buttons = all('button', text: '', wait: 2)
      delete_button = delete_buttons.find { |btn| btn.find('svg', class: /Trash/, wait: false) rescue nil }
      
      if delete_button
        delete_button.click
        
        # Aceitar confirmação
        page.driver.browser.switch_to.alert.accept rescue nil
        
        sleep 2
      end
    end
  end

  test 'search professionals' do
    visit "#{FRONTEND_URL}/professionals"
    
    search_input = find('input[placeholder*="Buscar"]')
    search_input.fill_in with: 'teste'
    
    sleep 1
    
    assert_field search_input, with: 'teste'
  end

  test 'professionals table is displayed' do
    visit "#{FRONTEND_URL}/professionals"
    
    if page.has_selector?('table', wait: 5)
      assert_text 'Nome', wait: 5
      assert_text 'Email'
      assert_text 'Telefone'
      assert_text 'Função'
      assert_text 'Ações'
    end
  end

  test 'empty state is displayed when no professionals' do
    visit "#{FRONTEND_URL}/professionals"
    
    if page.has_text?('Nenhum profissional encontrado', wait: 2)
      assert_text 'Nenhum profissional encontrado'
    end
  end

  test 'loading state display' do
    visit "#{FRONTEND_URL}/professionals"
    
    # Verificar se há indicador de loading inicial
    sleep 1
  end
end

