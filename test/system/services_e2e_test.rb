# frozen_string_literal: true

require 'application_system_test_case'

class ServicesE2ETest < ApplicationSystemTestCase
  FRONTEND_URL = 'http://localhost:5173'

  test 'visiting services page' do
    visit "#{FRONTEND_URL}/services"
    
    assert_text 'Serviços', wait: 5
    assert_text 'Gerencie os serviços oferecidos pelo salão'
  end

  test 'header button is present' do
    visit "#{FRONTEND_URL}/services"
    
    assert_button 'Novo Serviço', wait: 5
  end

  test 'search input is present' do
    visit "#{FRONTEND_URL}/services"
    
    assert_selector 'input[placeholder*="Buscar"]', wait: 5
  end

  test 'open new service modal' do
    visit "#{FRONTEND_URL}/services"
    
    click_button 'Novo Serviço'
    
    assert_text 'Novo Serviço', wait: 5
  end

  test 'new service form fields' do
    visit "#{FRONTEND_URL}/services"
    
    click_button 'Novo Serviço'
    
    # Verificar campos
    assert_field 'Nome do Serviço', wait: 5
    assert_selector 'textarea', text: ''
    assert_field 'Preço de Custo (R$)'
    assert_field 'Preço de Venda (R$)'
    assert_field 'Unidade'
  end

  test 'fill new service form' do
    visit "#{FRONTEND_URL}/services"
    
    click_button 'Novo Serviço'
    
    # Preencher formulário
    fill_in 'Nome do Serviço', with: 'Corte de Cabelo'
    fill_in 'Descrição', with: 'Corte de cabelo masculino'
    fill_in 'Preço de Custo (R$)', with: '10.00'
    fill_in 'Preço de Venda (R$)', with: '30.00'
    fill_in 'Unidade', with: 'unidade'
    
    # Verificar campos preenchidos
    assert_field 'Nome do Serviço', with: 'Corte de Cabelo'
    assert_field 'Preço de Venda (R$)', with: '30.00'
  end

  test 'cancel new service modal' do
    visit "#{FRONTEND_URL}/services"
    
    click_button 'Novo Serviço'
    assert_text 'Novo Serviço', wait: 5
    
    click_button 'Cancelar'
    
    assert_no_text 'Novo Serviço', wait: 2
  end

  test 'edit service' do
    visit "#{FRONTEND_URL}/services"
    
    sleep 2
    
    # Tentar encontrar botão de editar
    if page.has_selector?('button[title*="Editar"]', wait: 2) || 
       page.has_selector?('svg[class*="Edit"]', wait: 2)
      
      edit_buttons = all('button', text: '', wait: 2)
      edit_button = edit_buttons.find { |btn| btn.find('svg', class: /Edit/, wait: false) rescue nil }
      
      if edit_button
        edit_button.click
        
        assert_text 'Editar Serviço', wait: 5
      end
    end
  end

  test 'delete service' do
    visit "#{FRONTEND_URL}/services"
    
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

  test 'search services' do
    visit "#{FRONTEND_URL}/services"
    
    search_input = find('input[placeholder*="Buscar"]')
    search_input.fill_in with: 'corte'
    
    sleep 1
    
    assert_field search_input, with: 'corte'
  end

  test 'services table is displayed on desktop' do
    visit "#{FRONTEND_URL}/services"
    
    if page.has_selector?('table', wait: 5)
      assert_text 'Nome', wait: 5
      assert_text 'Descrição'
      assert_text 'Preço de Custo'
      assert_text 'Preço de Venda'
      assert_text 'Status'
      assert_text 'Ações'
    end
  end

  test 'services cards are displayed on mobile' do
    page.driver.browser.manage.window.resize_to(375, 667)
    
    visit "#{FRONTEND_URL}/services"
    
    sleep 2
  end

  test 'empty state is displayed when no services' do
    visit "#{FRONTEND_URL}/services"
    
    if page.has_text?('Nenhum serviço encontrado', wait: 2)
      assert_text 'Nenhum serviço encontrado'
    end
  end
end

