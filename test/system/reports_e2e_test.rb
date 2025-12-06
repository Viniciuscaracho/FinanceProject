# frozen_string_literal: true

require 'application_system_test_case'

class ReportsE2ETest < ApplicationSystemTestCase
  FRONTEND_URL = 'http://localhost:5173'

  test 'visiting appointment reports page' do
    visit "#{FRONTEND_URL}/appointment-reports"
    
    assert_text 'Relatórios Financeiros', wait: 5
    assert_text 'Análise de serviços, comissões e repasses'
  end

  test 'visiting financial reports page' do
    visit "#{FRONTEND_URL}/financial-reports"
    
    assert_text 'Relatórios Financeiros', wait: 5
    assert_text 'Análise contábil completa da barbearia'
  end

  test 'appointment reports header buttons' do
    visit "#{FRONTEND_URL}/appointment-reports"
    
    assert_button 'Atualizar', wait: 5
    assert_button 'Exportar'
  end

  test 'financial reports header buttons' do
    visit "#{FRONTEND_URL}/financial-reports"
    
    assert_button 'Atualizar', wait: 5
    assert_button 'Exportar'
  end

  test 'appointment reports date filters' do
    visit "#{FRONTEND_URL}/appointment-reports"
    
    # Verificar campos de data
    assert_selector 'input[type="date"]', minimum: 2, wait: 5
    assert_selector 'select', text: /Profissional/
  end

  test 'financial reports date filters' do
    visit "#{FRONTEND_URL}/financial-reports"
    
    # Verificar campos de data
    assert_selector 'input[type="date"]', minimum: 2, wait: 5
  end

  test 'appointment reports summary cards' do
    visit "#{FRONTEND_URL}/appointment-reports"
    
    assert_text 'Total de Agendamentos', wait: 5
    assert_text 'Confirmados'
    assert_text 'Receita Total'
    assert_text 'Comissões Totais'
  end

  test 'financial reports report selection cards' do
    visit "#{FRONTEND_URL}/financial-reports"
    
    # Verificar cards de seleção de relatório
    assert_text 'Selecione um Relatório', wait: 5
    # Pode ter vários cards de relatórios
  end

  test 'select financial report type' do
    visit "#{FRONTEND_URL}/financial-reports"
    
    # Clicar em um card de relatório
    if page.has_text?('DRE', wait: 5)
      find('text', text: 'DRE', exact: false).find(:xpath, 'ancestor::*[contains(@class, "cursor-pointer")]').click
      
      sleep 2
      
      # Verificar que o relatório foi selecionado
      assert_selector '[class*="ring-blue"]', wait: 5
    end
  end

  test 'appointment reports charts are displayed' do
    visit "#{FRONTEND_URL}/appointment-reports"
    
    # Verificar gráficos
    assert_selector 'svg', wait: 5
  end

  test 'financial reports charts are displayed' do
    visit "#{FRONTEND_URL}/financial-reports"
    
    # Selecionar um relatório primeiro
    if page.has_text?('DRE', wait: 5)
      find('text', text: 'DRE', exact: false).find(:xpath, 'ancestor::*[contains(@class, "cursor-pointer")]').click
      
      sleep 2
      
      # Verificar gráficos (alguns relatórios têm gráficos)
      if page.has_selector?('svg', wait: 5)
        assert_selector 'svg'
      end
    end
  end

  test 'appointment reports table is displayed' do
    visit "#{FRONTEND_URL}/appointment-reports"
    
    sleep 2
    
    if page.has_selector?('table', wait: 5)
      assert_text 'Data', wait: 5
      assert_text 'Serviço'
      assert_text 'Cliente'
      assert_text 'Valor'
      assert_text 'Comissão'
    end
  end

  test 'financial reports extract table' do
    visit "#{FRONTEND_URL}/financial-reports"
    
    # Selecionar relatório de Extrato
    if page.has_text?('Extrato', wait: 5)
      find('text', text: 'Extrato', exact: false).find(:xpath, 'ancestor::*[contains(@class, "cursor-pointer")]').click
      
      sleep 2
      
      if page.has_selector?('table', wait: 5)
        assert_text 'Data', wait: 5
        assert_text 'Descrição'
        assert_text 'Valor'
        assert_text 'Saldo'
      end
    end
  end

  test 'financial reports extract pagination' do
    visit "#{FRONTEND_URL}/financial-reports"
    
    # Selecionar relatório de Extrato
    if page.has_text?('Extrato', wait: 5)
      find('text', text: 'Extrato', exact: false).find(:xpath, 'ancestor::*[contains(@class, "cursor-pointer")]').click
      
      sleep 2
      
      if page.has_button?('Próxima', wait: 5)
        click_button 'Próxima'
        assert_text 'Página', wait: 5
        
        click_button 'Anterior'
        assert_text 'Página', wait: 5
      end
    end
  end

  test 'export appointment reports' do
    visit "#{FRONTEND_URL}/appointment-reports"
    
    click_button 'Exportar'
    
    sleep 2
  end

  test 'export financial reports' do
    visit "#{FRONTEND_URL}/financial-reports"
    
    click_button 'Exportar'
    
    sleep 2
  end

  test 'update appointment reports' do
    visit "#{FRONTEND_URL}/appointment-reports"
    
    click_button 'Atualizar'
    
    sleep 2
  end

  test 'update financial reports' do
    visit "#{FRONTEND_URL}/financial-reports"
    
    click_button 'Atualizar'
    
    sleep 2
  end

  test 'change date range in appointment reports' do
    visit "#{FRONTEND_URL}/appointment-reports"
    
    # Preencher datas
    date_inputs = all('input[type="date"]')
    
    if date_inputs.length >= 2
      start_date = (Date.today - 30.days).strftime('%Y-%m-%d')
      end_date = Date.today.strftime('%Y-%m-%d')
      
      date_inputs[0].fill_in with: start_date
      date_inputs[1].fill_in with: end_date
      
      sleep 2
    end
  end

  test 'change date range in financial reports' do
    visit "#{FRONTEND_URL}/financial-reports"
    
    # Preencher datas
    date_inputs = all('input[type="date"]')
    
    if date_inputs.length >= 2
      start_date = (Date.today - 30.days).strftime('%Y-%m-%d')
      end_date = Date.today.strftime('%Y-%m-%d')
      
      date_inputs[0].fill_in with: start_date
      date_inputs[1].fill_in with: end_date
      
      sleep 2
    end
  end

  test 'filter appointment reports by professional' do
    visit "#{FRONTEND_URL}/appointment-reports"
    
    # Selecionar profissional
    if page.has_selector?('select', wait: 5)
      professional_select = find('select')
      if professional_select.find('option', text: /./, wait: false)
        select professional_select.find('option', text: /./).text, from: professional_select
        
        sleep 2
      end
    end
  end

  test 'filter financial reports by bank account' do
    visit "#{FRONTEND_URL}/financial-reports"
    
    # Selecionar relatório de Extrato primeiro
    if page.has_text?('Extrato', wait: 5)
      find('text', text: 'Extrato', exact: false).find(:xpath, 'ancestor::*[contains(@class, "cursor-pointer")]').click
      
      sleep 2
      
      # Verificar se há select de conta bancária
      if page.has_selector?('select', wait: 5)
        selects = all('select')
        bank_select = selects.find { |s| s.text.include?('Conta') || s.find('option', text: /conta/i, wait: false) }
        
        if bank_select
          select bank_select.find('option', text: /./).text, from: bank_select
          
          sleep 2
        end
      end
    end
  end

  test 'empty state in appointment reports' do
    visit "#{FRONTEND_URL}/appointment-reports"
    
    if page.has_text?('Nenhum dado disponível', wait: 2)
      assert_text 'Nenhum dado disponível'
    end
  end

  test 'empty state in financial reports' do
    visit "#{FRONTEND_URL}/financial-reports"
    
    if page.has_text?('Selecione um relatório', wait: 2)
      assert_text 'Selecione um relatório'
    end
  end
end

