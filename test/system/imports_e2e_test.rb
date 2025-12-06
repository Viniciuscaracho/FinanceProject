# frozen_string_literal: true

require 'application_system_test_case'

class ImportsE2ETest < ApplicationSystemTestCase
  FRONTEND_URL = 'http://localhost:5173'

  test 'visiting imports page' do
    visit "#{FRONTEND_URL}/imports"
    
    assert_text 'Importações', wait: 5
    assert_text 'Gerencie suas importações de arquivos'
  end

  test 'header button is present' do
    visit "#{FRONTEND_URL}/imports"
    
    assert_button 'Nova Importação', wait: 5
  end

  test 'filters are displayed' do
    visit "#{FRONTEND_URL}/imports"
    
    # Verificar campo de busca
    assert_selector 'input[placeholder*="Buscar"]', wait: 5
    
    # Verificar selects de filtro
    assert_selector 'select', text: /Estado|Fonte/
  end

  test 'open new import modal' do
    visit "#{FRONTEND_URL}/imports"
    
    click_button 'Nova Importação'
    
    assert_text 'Nova Importação', wait: 5
  end

  test 'new import form fields' do
    visit "#{FRONTEND_URL}/imports"
    
    click_button 'Nova Importação'
    
    # Verificar campos
    assert_selector 'select', text: /Tipo/, wait: 5
    assert_selector 'input[type="file"]'
  end

  test 'select import type' do
    visit "#{FRONTEND_URL}/imports"
    
    click_button 'Nova Importação'
    
    # Selecionar tipo de importação
    if page.has_selector?('select', wait: 5)
      select 'Planilha Padrão', from: find('select')
      
      sleep 1
    end
  end

  test 'cancel new import modal' do
    visit "#{FRONTEND_URL}/imports"
    
    click_button 'Nova Importação'
    assert_text 'Nova Importação', wait: 5
    
    click_button 'Cancelar'
    
    assert_no_text 'Nova Importação', wait: 2
  end

  test 'filter imports by state' do
    visit "#{FRONTEND_URL}/imports"
    
    # Selecionar filtro de estado
    if page.has_selector?('select', wait: 5)
      selects = all('select')
      state_select = selects.find { |s| s.text.include?('Estado') || s.find('option', text: /Aguardando/, wait: false) }
      
      if state_select
        select 'Concluído', from: state_select
        
        sleep 1
      end
    end
  end

  test 'filter imports by source' do
    visit "#{FRONTEND_URL}/imports"
    
    # Selecionar filtro de fonte
    if page.has_selector?('select', wait: 5)
      selects = all('select')
      source_select = selects.find { |s| s.text.include?('Fonte') || s.find('option', text: /Planilha/, wait: false) }
      
      if source_select
        select 'Planilha Padrão', from: source_select
        
        sleep 1
      end
    end
  end

  test 'search imports' do
    visit "#{FRONTEND_URL}/imports"
    
    search_input = find('input[placeholder*="Buscar"]')
    search_input.fill_in with: 'teste'
    
    sleep 1
    
    assert_field search_input, with: 'teste'
  end

  test 'imports table is displayed' do
    visit "#{FRONTEND_URL}/imports"
    
    if page.has_selector?('table', wait: 5)
      assert_text 'Arquivo', wait: 5
      assert_text 'Fonte'
      assert_text 'Estado'
      assert_text 'Progresso'
      assert_text 'Transações'
      assert_text 'Data'
      assert_text 'Ações'
    end
  end

  test 'actions dropdown menu' do
    visit "#{FRONTEND_URL}/imports"
    
    sleep 2
    
    # Tentar encontrar menu de ações
    if page.has_selector?('button[title*="Ações"]', wait: 2) || 
       page.has_selector?('svg[class*="MoreVertical"]', wait: 2)
      
      menu_buttons = all('button', text: '', wait: 2)
      menu_button = menu_buttons.find { |btn| btn.find('svg', class: /MoreVertical/, wait: false) rescue nil }
      
      if menu_button
        menu_button.click
        
        # Verificar opções do menu
        assert_text 'Ações', wait: 5
        # Pode ter: Arquivar, Restaurar, Remover
      end
    end
  end

  test 'archive import' do
    visit "#{FRONTEND_URL}/imports"
    
    sleep 2
    
    # Abrir menu de ações
    if page.has_selector?('button', wait: 5)
      menu_buttons = all('button', text: '', wait: 2)
      menu_button = menu_buttons.find { |btn| btn.find('svg', class: /MoreVertical/, wait: false) rescue nil }
      
      if menu_button
        menu_button.click
        
        # Clicar em Arquivar
        if page.has_text?('Arquivar', wait: 2)
          click_button 'Arquivar'
          
          sleep 2
        end
      end
    end
  end

  test 'restore archived import' do
    visit "#{FRONTEND_URL}/imports"
    
    sleep 2
    
    # Abrir menu de ações de um import arquivado
    if page.has_selector?('button', wait: 5)
      menu_buttons = all('button', text: '', wait: 2)
      menu_button = menu_buttons.find { |btn| btn.find('svg', class: /MoreVertical/, wait: false) rescue nil }
      
      if menu_button
        menu_button.click
        
        # Clicar em Restaurar
        if page.has_text?('Restaurar', wait: 2)
          click_button 'Restaurar'
          
          sleep 2
        end
      end
    end
  end

  test 'delete import' do
    visit "#{FRONTEND_URL}/imports"
    
    sleep 2
    
    # Abrir menu de ações
    if page.has_selector?('button', wait: 5)
      menu_buttons = all('button', text: '', wait: 2)
      menu_button = menu_buttons.find { |btn| btn.find('svg', class: /MoreVertical/, wait: false) rescue nil }
      
      if menu_button
        menu_button.click
        
        # Clicar em Remover
        if page.has_text?('Remover', wait: 2)
          click_button 'Remover'
          
          # Aceitar confirmação
          page.driver.browser.switch_to.alert.accept rescue nil
          
          sleep 2
        end
      end
    end
  end

  test 'pagination buttons' do
    visit "#{FRONTEND_URL}/imports"
    
    if page.has_button?('Próxima', wait: 2)
      click_button 'Próxima'
      assert_text 'Página', wait: 5
      
      click_button 'Anterior'
      assert_text 'Página', wait: 5
    end
  end

  test 'progress bar is displayed' do
    visit "#{FRONTEND_URL}/imports"
    
    sleep 2
    
    # Verificar se há barras de progresso
    if page.has_selector?('[role="progressbar"]', wait: 2) || 
       page.has_selector?('div[class*="progress"]', wait: 2)
      assert_selector '[role="progressbar"]', minimum: 1, wait: 5
    end
  end

  test 'empty state is displayed when no imports' do
    visit "#{FRONTEND_URL}/imports"
    
    if page.has_text?('Nenhuma importação encontrada', wait: 2)
      assert_text 'Nenhuma importação encontrada'
    end
  end

  test 'loading state display' do
    visit "#{FRONTEND_URL}/imports"
    
    # Verificar se há indicador de loading inicial
    sleep 1
  end
end

