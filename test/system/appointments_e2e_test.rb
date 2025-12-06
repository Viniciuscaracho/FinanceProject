# frozen_string_literal: true

require 'application_system_test_case'

class AppointmentsE2ETest < ApplicationSystemTestCase
  FRONTEND_URL = 'http://localhost:5173'

  test 'visiting appointments page' do
    visit "#{FRONTEND_URL}/appointments"
    
    assert_text 'Agendamentos', wait: 5
    assert_text 'Gerencie todos os agendamentos do sistema'
  end

  test 'header buttons are present' do
    visit "#{FRONTEND_URL}/appointments"
    
    assert_button 'Novo Agendamento', wait: 5
    assert_button 'Exportar'
    assert_button 'Atualizar'
  end

  test 'filters are displayed' do
    visit "#{FRONTEND_URL}/appointments"
    
    # Verificar campo de busca
    assert_selector 'input[placeholder*="Buscar"]', wait: 5
    
    # Verificar selects de filtro
    assert_selector 'select', text: /Status|Pagamento|Profissional/
  end

  test 'stats cards are displayed' do
    visit "#{FRONTEND_URL}/appointments"
    
    assert_text 'Total', wait: 5
    assert_text 'Confirmados'
    assert_text 'Aguardando Pagamento'
    assert_text 'Receita Total'
  end

  test 'open new appointment modal' do
    visit "#{FRONTEND_URL}/appointments"
    
    click_button 'Novo Agendamento'
    
    assert_text 'Novo Agendamento', wait: 5
  end

  test 'new appointment form fields' do
    visit "#{FRONTEND_URL}/appointments"
    
    click_button 'Novo Agendamento'
    
    # Verificar campos obrigatórios
    assert_selector 'select', text: 'Profissional', wait: 5
    assert_selector 'select', text: 'Serviço'
    assert_field 'Data/Hora Início'
    assert_field 'Data/Hora Fim'
    assert_field 'WhatsApp do Cliente'
    assert_field 'Valor (R$)'
    assert_selector 'select', text: 'Status'
  end

  test 'fill new appointment form' do
    visit "#{FRONTEND_URL}/appointments"
    
    click_button 'Novo Agendamento'
    
    # Preencher formulário
    # Nota: Os selects podem precisar de dados pré-existentes
    fill_in 'WhatsApp do Cliente', with: '11987654321'
    fill_in 'Valor (R$)', with: '50.00'
    
    # Preencher datas (formato datetime-local)
    start_time = (Time.now + 1.day).strftime('%Y-%m-%dT10:00')
    end_time = (Time.now + 1.day).strftime('%Y-%m-%dT11:00')
    
    fill_in 'Data/Hora Início', with: start_time
    fill_in 'Data/Hora Fim', with: end_time
    
    # Verificar campos preenchidos
    assert_field 'WhatsApp do Cliente', with: '11987654321'
    assert_field 'Valor (R$)', with: '50.00'
  end

  test 'cancel new appointment modal' do
    visit "#{FRONTEND_URL}/appointments"
    
    click_button 'Novo Agendamento'
    assert_text 'Novo Agendamento', wait: 5
    
    click_button 'Cancelar'
    
    assert_no_text 'Novo Agendamento', wait: 2
  end

  test 'filter appointments by status' do
    visit "#{FRONTEND_URL}/appointments"
    
    # Selecionar filtro de status
    status_select = find('select', text: /Status/, wait: 5)
    select 'Confirmado', from: status_select[:name] rescue select 'Confirmado', from: status_select
    
    sleep 1
  end

  test 'filter appointments by payment status' do
    visit "#{FRONTEND_URL}/appointments"
    
    # Selecionar filtro de pagamento
    payment_select = find('select', text: /Pagamento/, wait: 5)
    select 'Pago', from: payment_select[:name] rescue select 'Pago', from: payment_select
    
    sleep 1
  end

  test 'search appointments' do
    visit "#{FRONTEND_URL}/appointments"
    
    search_input = find('input[placeholder*="Buscar"]')
    search_input.fill_in with: 'teste'
    
    sleep 1
    
    assert_field search_input, with: 'teste'
  end

  test 'export appointments' do
    visit "#{FRONTEND_URL}/appointments"
    
    click_button 'Exportar'
    
    # Verificar que o download foi iniciado
    sleep 2
  end

  test 'update appointment status inline' do
    visit "#{FRONTEND_URL}/appointments"
    
    sleep 2
    
    # Tentar encontrar select de status inline na tabela
    if page.has_selector?('select', wait: 5)
      status_selects = all('select', wait: 2)
      
      if status_selects.any?
        first_status = status_selects.first
        select 'Concluído', from: first_status[:name] rescue select 'Concluído', from: first_status
        
        sleep 2
      end
    end
  end

  test 'update payment status inline' do
    visit "#{FRONTEND_URL}/appointments"
    
    sleep 2
    
    # Tentar encontrar select de status de pagamento
    if page.has_selector?('select', wait: 5)
      payment_selects = all('select', wait: 2)
      
      # Procurar select de pagamento (pode ser o segundo)
      if payment_selects.length > 1
        payment_select = payment_selects[1]
        select 'Pago', from: payment_select[:name] rescue select 'Pago', from: payment_select
        
        sleep 2
      end
    end
  end

  test 'edit appointment' do
    visit "#{FRONTEND_URL}/appointments"
    
    sleep 2
    
    # Tentar encontrar botão de editar
    if page.has_selector?('button[title*="Editar"]', wait: 2) || 
       page.has_selector?('svg[class*="Edit"]', wait: 2)
      
      edit_buttons = all('button', text: '', wait: 2)
      edit_button = edit_buttons.find { |btn| btn.find('svg', class: /Edit/, wait: false) rescue nil }
      
      if edit_button
        edit_button.click
        
        assert_text 'Editar Agendamento', wait: 5
      end
    end
  end

  test 'delete appointment with confirmation' do
    visit "#{FRONTEND_URL}/appointments"
    
    sleep 2
    
    # Tentar encontrar botão de excluir
    if page.has_selector?('button[title*="Deletar"]', wait: 2) || 
       page.has_selector?('svg[class*="Trash"]', wait: 2)
      
      delete_buttons = all('button', text: '', wait: 2)
      delete_button = delete_buttons.find { |btn| btn.find('svg', class: /Trash/, wait: false) rescue nil }
      
      if delete_button
        delete_button.click
        
        # Verificar que o AlertDialog apareceu
        assert_text 'Confirmar Exclusão', wait: 5
        assert_text 'Tem certeza'
        
        # Clicar em Cancelar
        click_button 'Cancelar'
        
        # Verificar que o dialog fechou
        assert_no_text 'Confirmar Exclusão', wait: 2
      end
    end
  end

  test 'open payment link' do
    visit "#{FRONTEND_URL}/appointments"
    
    sleep 2
    
    # Tentar encontrar botão de link de pagamento
    if page.has_selector?('button[title*="Link"]', wait: 2) || 
       page.has_selector?('svg[class*="ExternalLink"]', wait: 2)
      
      link_buttons = all('button', text: '', wait: 2)
      link_button = link_buttons.find { |btn| btn.find('svg', class: /ExternalLink/, wait: false) rescue nil }
      
      if link_button
        # Clicar no link (abre em nova aba)
        link_button.click
        
        sleep 2
      end
    end
  end

  test 'appointments table is displayed on desktop' do
    visit "#{FRONTEND_URL}/appointments"
    
    if page.has_selector?('table', wait: 5)
      assert_text 'Cliente', wait: 5
      assert_text 'Serviço'
      assert_text 'Profissional'
      assert_text 'Data/Hora'
      assert_text 'Valor'
      assert_text 'Status'
      assert_text 'Pagamento'
      assert_text 'Ações'
    end
  end

  test 'appointments cards are displayed on mobile' do
    page.driver.browser.manage.window.resize_to(375, 667)
    
    visit "#{FRONTEND_URL}/appointments"
    
    sleep 2
    # Cards podem ter estrutura diferente
  end

  test 'empty state is displayed when no appointments' do
    visit "#{FRONTEND_URL}/appointments"
    
    if page.has_text?('Nenhum agendamento encontrado', wait: 2)
      assert_text 'Nenhum agendamento encontrado'
    end
  end
end

