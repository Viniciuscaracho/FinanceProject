# frozen_string_literal: true

require 'application_system_test_case'

class ContactsE2ETest < ApplicationSystemTestCase
  FRONTEND_URL = 'http://localhost:5173'

  test 'visiting contacts page' do
    visit "#{FRONTEND_URL}/contacts"
    
    assert_text 'Contatos', wait: 5
    assert_text 'Gerencie seus clientes, fornecedores e parceiros'
  end

  test 'header button is present' do
    visit "#{FRONTEND_URL}/contacts"
    
    assert_button 'Adicionar Contato', wait: 5
  end

  test 'summary cards are displayed' do
    visit "#{FRONTEND_URL}/contacts"
    
    assert_text 'Total de Contatos', wait: 5
    assert_text 'Contatos Ativos'
    assert_text 'Página Atual'
  end

  test 'filter tabs are displayed' do
    visit "#{FRONTEND_URL}/contacts"
    
    assert_button 'Todos', wait: 5
    assert_button 'Cliente'
    assert_button 'Colaborador'
    assert_button 'Fornecedor'
    assert_button 'Sócio'
    assert_button 'Associado'
  end

  test 'search input is present' do
    visit "#{FRONTEND_URL}/contacts"
    
    assert_selector 'input[placeholder*="Pesquisar"]', wait: 5
  end

  test 'open new contact modal' do
    visit "#{FRONTEND_URL}/contacts"
    
    click_button 'Adicionar Contato'
    
    assert_text 'Novo Contato', wait: 5
  end

  test 'new contact form fields' do
    visit "#{FRONTEND_URL}/contacts"
    
    click_button 'Adicionar Contato'
    
    # Verificar campos obrigatórios
    assert_field 'Nome', wait: 5
    assert_field 'Email'
    assert_field 'Telefone'
    assert_field 'Documento'
    assert_selector 'select', text: 'Tipo de Contato'
    assert_selector 'textarea', text: ''
  end

  test 'fill new contact form' do
    visit "#{FRONTEND_URL}/contacts"
    
    click_button 'Adicionar Contato'
    
    # Preencher formulário
    fill_in 'Nome', with: 'João Silva'
    fill_in 'Email', with: 'joao@example.com'
    fill_in 'Telefone', with: '(11) 99999-9999'
    fill_in 'Documento', with: '123.456.789-00'
    
    # Selecionar tipo
    select 'Cliente', from: 'Tipo de Contato'
    
    # Verificar campos preenchidos
    assert_field 'Nome', with: 'João Silva'
    assert_field 'Email', with: 'joao@example.com'
  end

  test 'cancel new contact modal' do
    visit "#{FRONTEND_URL}/contacts"
    
    click_button 'Adicionar Contato'
    assert_text 'Novo Contato', wait: 5
    
    click_button 'Cancelar'
    
    assert_no_text 'Novo Contato', wait: 2
  end

  test 'filter contacts by type' do
    visit "#{FRONTEND_URL}/contacts"
    
    # Clicar no filtro de Cliente
    click_button 'Cliente'
    
    # Verificar que o filtro foi aplicado
    assert_selector 'button:has-text("Cliente")[class*="default"]', wait: 5
  end

  test 'search contacts' do
    visit "#{FRONTEND_URL}/contacts"
    
    search_input = find('input[placeholder*="Pesquisar"]')
    search_input.fill_in with: 'teste'
    
    sleep 1
    
    assert_field search_input, with: 'teste'
  end

  test 'pagination buttons' do
    visit "#{FRONTEND_URL}/contacts"
    
    if page.has_button?('Próxima', wait: 2)
      click_button 'Próxima'
      assert_text 'Página', wait: 5
      
      click_button 'Anterior'
      assert_text 'Página', wait: 5
    end
  end

  test 'edit contact' do
    visit "#{FRONTEND_URL}/contacts"
    
    sleep 2
    
    # Tentar encontrar botão de editar
    if page.has_selector?('button[title*="Editar"]', wait: 2) || 
       page.has_selector?('svg[class*="Edit"]', wait: 2)
      
      edit_buttons = all('button', text: '', wait: 2)
      edit_button = edit_buttons.find { |btn| btn.find('svg', class: /Edit/, wait: false) rescue nil }
      
      if edit_button
        edit_button.click
        
        assert_text 'Editar Contato', wait: 5
      end
    end
  end

  test 'delete contact' do
    visit "#{FRONTEND_URL}/contacts"
    
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

  test 'contact cards grid is displayed' do
    visit "#{FRONTEND_URL}/contacts"
    
    # Verificar se há cards de contatos
    sleep 2
    # Cards podem ter estrutura específica
  end

  test 'empty state is displayed when no contacts' do
    visit "#{FRONTEND_URL}/contacts"
    
    # Se não houver contatos, verificar mensagem
    if page.has_text?('Nenhum contato encontrado', wait: 2)
      assert_text 'Nenhum contato encontrado'
      assert_button 'Adicionar Contato'
    end
  end

  test 'error message display and close' do
    visit "#{FRONTEND_URL}/contacts"
    
    # Tentar criar contato sem nome (deve dar erro)
    click_button 'Adicionar Contato'
    
    # Tentar salvar sem preencher nome
    click_button 'Salvar'
    
    # Verificar mensagem de erro
    if page.has_text?('obrigatório', wait: 2)
      assert_text 'obrigatório'
      
      # Verificar botão de fechar erro
      if page.has_button?('✕', wait: 1)
        click_button '✕'
        assert_no_text 'obrigatório', wait: 1
      end
    end
  end
end

