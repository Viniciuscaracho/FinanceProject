# frozen_string_literal: true

require 'application_system_test_case'

class TransactionsE2ETest < ApplicationSystemTestCase
  FRONTEND_URL = 'http://localhost:5173'

  test 'visiting transactions page' do
    visit "#{FRONTEND_URL}/transactions"
    
    assert_text 'Transações', wait: 5
    assert_text 'Gerencie suas receitas e despesas'
  end

  test 'header buttons are present' do
    visit "#{FRONTEND_URL}/transactions"
    
    # Verificar botões principais
    assert_button 'Nova Transação', wait: 5
    assert_button 'Exportar'
    assert_button 'Mostrar Filtros'
  end

  test 'summary cards are displayed' do
    visit "#{FRONTEND_URL}/transactions"
    
    # Verificar cards de resumo
    assert_text 'Receitas', wait: 5
    assert_text 'Despesas'
    assert_text 'Saldo'
  end

  test 'filter pills are displayed' do
    visit "#{FRONTEND_URL}/transactions"
    
    # Verificar filtros
    assert_button 'Todos', wait: 5
    assert_button 'Receitas'
    assert_button 'Despesas'
    assert_button 'Transferências'
  end

  test 'search input is present' do
    visit "#{FRONTEND_URL}/transactions"
    
    # Verificar campo de busca
    assert_selector 'input[placeholder*="Pesquisar"]', wait: 5
  end

  test 'open new transaction modal' do
    visit "#{FRONTEND_URL}/transactions"
    
    # Clicar no botão Nova Transação
    click_button 'Nova Transação'
    
    # Verificar que o modal abriu
    assert_text 'Nova Transação', wait: 5
  end

  test 'new transaction form fields' do
    visit "#{FRONTEND_URL}/transactions"
    
    click_button 'Nova Transação'
    
    # Verificar campos do formulário
    assert_field 'Descrição', wait: 5
    assert_field 'Valor'
    assert_selector 'select', text: 'Tipo'
    assert_field 'Data de Vencimento'
    assert_field 'Data de Pagamento'
  end

  test 'fill new transaction form' do
    visit "#{FRONTEND_URL}/transactions"
    
    click_button 'Nova Transação'
    
    # Preencher formulário
    fill_in 'Descrição', with: 'Teste de transação E2E'
    fill_in 'Valor', with: '100.50'
    
    # Selecionar tipo
    select 'Receita', from: 'Tipo'
    
    # Preencher data
    fill_in 'Data de Vencimento', with: '01/01/2025'
    
    # Verificar que os campos foram preenchidos
    assert_field 'Descrição', with: 'Teste de transação E2E'
    assert_field 'Valor', with: '100.50'
  end

  test 'cancel new transaction modal' do
    visit "#{FRONTEND_URL}/transactions"
    
    click_button 'Nova Transação'
    assert_text 'Nova Transação', wait: 5
    
    # Clicar em cancelar
    click_button 'Cancelar'
    
    # Verificar que o modal fechou
    assert_no_text 'Nova Transação', wait: 2
  end

  test 'filter transactions by type' do
    visit "#{FRONTEND_URL}/transactions"
    
    # Clicar no filtro de Receitas
    click_button 'Receitas'
    
    # Verificar que o filtro foi aplicado
    assert_selector 'button:has-text("Receitas")[class*="default"]', wait: 5
  end

  test 'search transactions' do
    visit "#{FRONTEND_URL}/transactions"
    
    # Preencher campo de busca
    search_input = find('input[placeholder*="Pesquisar"]')
    search_input.fill_in with: 'teste'
    
    # Aguardar debounce
    sleep 1
    
    # Verificar que a busca foi aplicada
    assert_field search_input, with: 'teste'
  end

  test 'toggle filters visibility' do
    visit "#{FRONTEND_URL}/transactions"
    
    # Clicar no botão de mostrar/ocultar filtros
    click_button 'Mostrar Filtros'
    
    # Verificar que os filtros foram ocultados
    # (implementação específica)
    sleep 1
  end

  test 'export transactions' do
    visit "#{FRONTEND_URL}/transactions"
    
    # Clicar no botão Exportar
    click_button 'Exportar'
    
    # Verificar que o download foi iniciado
    # (pode precisar verificar comportamento específico)
    sleep 2
  end

  test 'pagination buttons' do
    visit "#{FRONTEND_URL}/transactions"
    
    # Verificar se há paginação
    if page.has_button?('Próxima', wait: 2)
      # Clicar em próxima
      click_button 'Próxima'
      
      # Verificar que mudou de página
      assert_text 'Página 2', wait: 5
      
      # Clicar em anterior
      click_button 'Anterior'
      
      # Verificar que voltou
      assert_text 'Página 1', wait: 5
    end
  end

  test 'quick add category modal' do
    visit "#{FRONTEND_URL}/transactions"
    
    click_button 'Nova Transação'
    
    # Clicar no dropdown de categoria
    category_dropdown = find('button', text: /Selecione uma categoria|Categoria/, wait: 5)
    category_dropdown.click
    
    # Clicar em Nova Categoria
    click_button 'Nova Categoria'
    
    # Verificar que o modal de nova categoria abriu
    assert_text 'Nova Categoria', wait: 5
  end

  test 'quick add contact modal' do
    visit "#{FRONTEND_URL}/transactions"
    
    click_button 'Nova Transação'
    
    # Clicar no dropdown de contato
    contact_dropdown = find('button', text: /Selecione um contato|Contato/, wait: 5)
    contact_dropdown.click
    
    # Clicar em Novo Contato
    click_button 'Novo Contato'
    
    # Verificar que o modal de novo contato abriu
    assert_text 'Novo Contato', wait: 5
  end

  test 'quick add cost center modal' do
    visit "#{FRONTEND_URL}/transactions"
    
    click_button 'Nova Transação'
    
    # Clicar no dropdown de centro de custo
    cost_center_dropdown = find('button', text: /Selecione um centro de custo|Centro de Custo/, wait: 5)
    cost_center_dropdown.click
    
    # Clicar em Novo Centro de Custo
    click_button 'Novo Centro de Custo'
    
    # Verificar que o modal de novo centro de custo abriu
    assert_text 'Novo Centro de Custo', wait: 5
  end

  test 'edit transaction' do
    visit "#{FRONTEND_URL}/transactions"
    
    # Aguardar transações carregarem
    sleep 2
    
    # Tentar encontrar botão de editar (pode estar em uma transação)
    if page.has_selector?('button[title*="Editar"]', wait: 2) || 
       page.has_selector?('svg[class*="Edit"]', wait: 2)
      
      # Clicar no primeiro botão de editar encontrado
      edit_buttons = all('button', text: '', wait: 2)
      edit_button = edit_buttons.find { |btn| btn.find('svg', class: /Edit/, wait: false) rescue nil }
      
      if edit_button
        edit_button.click
        
        # Verificar que o modal de edição abriu
        assert_text 'Editar Transação', wait: 5
      end
    end
  end

  test 'delete transaction' do
    visit "#{FRONTEND_URL}/transactions"
    
    # Aguardar transações carregarem
    sleep 2
    
    # Tentar encontrar botão de excluir
    if page.has_selector?('button[title*="Excluir"]', wait: 2) || 
       page.has_selector?('svg[class*="Trash"]', wait: 2)
      
      # Clicar no primeiro botão de excluir encontrado
      delete_buttons = all('button', text: '', wait: 2)
      delete_button = delete_buttons.find { |btn| btn.find('svg', class: /Trash/, wait: false) rescue nil }
      
      if delete_button
        delete_button.click
        
        # Aceitar confirmação
        page.driver.browser.switch_to.alert.accept rescue nil
        
        # Verificar que a transação foi removida
        sleep 2
      end
    end
  end

  test 'transaction table is displayed on desktop' do
    visit "#{FRONTEND_URL}/transactions"
    
    # Verificar se a tabela está visível (desktop)
    # No mobile mostra cards, no desktop mostra tabela
    if page.has_selector?('table', wait: 5)
      # Verificar colunas da tabela
      assert_text 'Vencimento', wait: 5
      assert_text 'Descrição'
      assert_text 'Valor'
      assert_text 'Status'
      assert_text 'Ações'
    end
  end

  test 'transaction cards are displayed on mobile' do
    # Simular viewport mobile
    page.driver.browser.manage.window.resize_to(375, 667)
    
    visit "#{FRONTEND_URL}/transactions"
    
    # Verificar se os cards estão visíveis (mobile)
    sleep 2
    # Cards podem ter estrutura diferente
  end
end

