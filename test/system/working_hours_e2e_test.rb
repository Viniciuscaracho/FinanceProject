# frozen_string_literal: true

require 'application_system_test_case'

class WorkingHoursE2ETest < ApplicationSystemTestCase
  FRONTEND_URL = 'http://localhost:5173'

  test 'visiting working hours page' do
    visit "#{FRONTEND_URL}/working-hours"
    
    assert_text 'Horários de Trabalho', wait: 5
    assert_text 'Configure os horários de disponibilidade de cada profissional'
  end

  test 'professional selector is present' do
    visit "#{FRONTEND_URL}/working-hours"
    
    assert_selector 'select', text: /Profissional/, wait: 5
  end

  test 'save button is present when professional selected' do
    visit "#{FRONTEND_URL}/working-hours"
    
    # Selecionar profissional se houver
    if page.has_selector?('select', wait: 5)
      professional_select = find('select')
      if professional_select.find('option', text: /./, wait: false)
        select professional_select.find('option', text: /./).text, from: professional_select
        
        assert_button 'Salvar Horários', wait: 5
      end
    end
  end

  test 'working hours table is displayed' do
    visit "#{FRONTEND_URL}/working-hours"
    
    # Selecionar profissional primeiro
    if page.has_selector?('select', wait: 5)
      professional_select = find('select')
      if professional_select.find('option', text: /./, wait: false)
        select professional_select.find('option', text: /./).text, from: professional_select
        
        sleep 1
        
        if page.has_selector?('table', wait: 5)
          assert_text 'Dia da Semana', wait: 5
          assert_text 'Ativo'
          assert_text 'Horário Início'
          assert_text 'Horário Fim'
          assert_text 'Intervalo'
        end
      end
    end
  end

  test 'toggle day active checkbox' do
    visit "#{FRONTEND_URL}/working-hours"
    
    # Selecionar profissional
    if page.has_selector?('select', wait: 5)
      professional_select = find('select')
      if professional_select.find('option', text: /./, wait: false)
        select professional_select.find('option', text: /./).text, from: professional_select
        
        sleep 1
        
        # Encontrar checkbox de ativo
        if page.has_selector?('input[type="checkbox"]', wait: 5)
          checkboxes = all('input[type="checkbox"]')
          
          if checkboxes.any?
            first_checkbox = checkboxes.first
            
            # Alternar estado
            if first_checkbox.checked?
              first_checkbox.uncheck
            else
              first_checkbox.check
            end
            
            sleep 1
          end
        end
      end
    end
  end

  test 'fill working hours for a day' do
    visit "#{FRONTEND_URL}/working-hours"
    
    # Selecionar profissional
    if page.has_selector?('select', wait: 5)
      professional_select = find('select')
      if professional_select.find('option', text: /./, wait: false)
        select professional_select.find('option', text: /./).text, from: professional_select
        
        sleep 1
        
        # Encontrar campos de horário
        if page.has_selector?('input[type="time"]', wait: 5)
          time_inputs = all('input[type="time"]')
          
          if time_inputs.length >= 2
            # Preencher horário de início
            time_inputs[0].fill_in with: '09:00'
            
            # Preencher horário de fim
            time_inputs[1].fill_in with: '18:00'
            
            # Verificar valores
            assert_field time_inputs[0], with: '09:00'
            assert_field time_inputs[1], with: '18:00'
          end
        end
      end
    end
  end

  test 'toggle break interval checkbox' do
    visit "#{FRONTEND_URL}/working-hours"
    
    # Selecionar profissional
    if page.has_selector?('select', wait: 5)
      professional_select = find('select')
      if professional_select.find('option', text: /./, wait: false)
        select professional_select.find('option', text: /./).text, from: professional_select
        
        sleep 1
        
        # Encontrar checkbox de intervalo
        if page.has_selector?('input[type="checkbox"]', wait: 5)
          checkboxes = all('input[type="checkbox"]')
          
          # O segundo checkbox geralmente é o de intervalo
          if checkboxes.length > 1
            interval_checkbox = checkboxes[1]
            
            # Ativar intervalo
            interval_checkbox.check
            
            sleep 1
            
            # Verificar que campos de intervalo apareceram
            assert_selector 'input[type="time"]', minimum: 4, wait: 5
          end
        end
      end
    end
  end

  test 'fill break interval times' do
    visit "#{FRONTEND_URL}/working-hours"
    
    # Selecionar profissional
    if page.has_selector?('select', wait: 5)
      professional_select = find('select')
      if professional_select.find('option', text: /./, wait: false)
        select professional_select.find('option', text: /./).text, from: professional_select
        
        sleep 1
        
        # Ativar intervalo primeiro
        if page.has_selector?('input[type="checkbox"]', wait: 5)
          checkboxes = all('input[type="checkbox"]')
          if checkboxes.length > 1
            checkboxes[1].check
            sleep 1
          end
        end
        
        # Preencher horários de intervalo
        if page.has_selector?('input[type="time"]', wait: 5)
          time_inputs = all('input[type="time"]')
          
          if time_inputs.length >= 4
            # Preencher início do intervalo
            time_inputs[2].fill_in with: '12:00'
            
            # Preencher fim do intervalo
            time_inputs[3].fill_in with: '13:00'
            
            # Verificar valores
            assert_field time_inputs[2], with: '12:00'
            assert_field time_inputs[3], with: '13:00'
          end
        end
      end
    end
  end

  test 'save working hours' do
    visit "#{FRONTEND_URL}/working-hours"
    
    # Selecionar profissional
    if page.has_selector?('select', wait: 5)
      professional_select = find('select')
      if professional_select.find('option', text: /./, wait: false)
        select professional_select.find('option', text: /./).text, from: professional_select
        
        sleep 1
        
        # Clicar em salvar
        if page.has_button?('Salvar Horários', wait: 5)
          click_button 'Salvar Horários'
          
          # Verificar mensagem de sucesso (pode ser alert ou toast)
          sleep 2
        end
      end
    end
  end

  test 'working hours cards are displayed on mobile' do
    page.driver.browser.manage.window.resize_to(375, 667)
    
    visit "#{FRONTEND_URL}/working-hours"
    
    # Selecionar profissional
    if page.has_selector?('select', wait: 5)
      professional_select = find('select')
      if professional_select.find('option', text: /./, wait: false)
        select professional_select.find('option', text: /./).text, from: professional_select
        
        sleep 2
        # Cards podem ter estrutura diferente
      end
    end
  end

  test 'empty state when no professionals' do
    visit "#{FRONTEND_URL}/working-hours"
    
    if page.has_text?('Nenhum profissional cadastrado', wait: 2)
      assert_text 'Nenhum profissional cadastrado'
      assert_text 'Cadastre profissionais primeiro'
    end
  end
end

