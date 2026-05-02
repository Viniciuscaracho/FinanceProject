# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class CommissionsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user, @account = register_user
        @bank_account = create_bank_account(@account)
        @account_user = @account.account_users.first
        
        # Gerar token de autenticação base64
        @auth_token = generate_auth_token(@user)
        
        # Configurar horário de trabalho
        @account_user.update!(
          schedule: {
            'monday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
            'tuesday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
            'wednesday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
            'thursday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
            'friday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 }
          }
        )
        
        @service = create_service(@account, selling_price_cents: 5000)
        @contact = create_contact(@account)
        
        # Criar agendamentos com comissões (5 dias atrás, segunda-feira às 10h)
        past_monday1 = (Time.current - 1.week).beginning_of_week + 1.day
        start_time1 = past_monday1.beginning_of_day + 10.hours
        
        @appointment1 = @account.appointments.create!(
          account_user: @account_user,
          service: @service,
          contact: @contact,
          start_time: start_time1,
          end_time: start_time1 + 1.hour,
          price_cents: 5000,
          whatsapp_number: "5511999999999",
          status: :confirmed,
          payment_status: :paid
        )
        
        # Marcar como completed após criar
        @appointment1.update!(status: :completed)
        
        # Criar comissão
        @commission1 = @appointment1.appointment_commissions.create!(
          account_user: @account_user,
          commission_type: 0, # percentage
          commission_value: 50.0,
          commission_amount_cents: 2500
        )
        
        # Criar segundo agendamento (3 dias atrás, quarta-feira às 10h)
        past_wednesday = (Time.current - 1.week).beginning_of_week + 3.days
        start_time2 = past_wednesday.beginning_of_day + 10.hours
        
        @appointment2 = @account.appointments.create!(
          account_user: @account_user,
          service: @service,
          contact: @contact,
          start_time: start_time2,
          end_time: start_time2 + 1.hour,
          price_cents: 5000,
          whatsapp_number: "5511888888888",
          status: :confirmed,
          payment_status: :paid
        )
        
        # Marcar como completed após criar
        @appointment2.update!(status: :completed)
        
        @commission2 = @appointment2.appointment_commissions.create!(
          account_user: @account_user,
          commission_type: 0, # percentage
          commission_value: 50.0,
          commission_amount_cents: 2500
        )
      end

      # GET /api/v1/commissions
      test "should list commissions" do
        get api_v1_commissions_path, headers: { 
          'Accept' => 'application/json',
          'Authorization' => "Bearer #{@auth_token}"
        }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert json_response.key?('commissions')
        assert json_response.key?('summary')
        assert_equal 1, json_response['commissions'].length # 1 profissional
        assert_equal 5000, json_response['summary']['total_commissions']['cents']
      end

      test "should filter commissions by date range" do
        # Ajustar datas para incluir os agendamentos criados
        start_date = (Time.current - 7.days).to_date
        end_date = (Time.current - 1.day).to_date
        
        get api_v1_commissions_path, 
            params: { 
              start_date: start_date.iso8601,
              end_date: end_date.iso8601
            }, 
            headers: { 'Accept' => 'application/json' }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        # Deve incluir ambos os agendamentos no período
        appointment_ids = json_response['commissions'].flat_map { |c| c['commissions'].map { |comm| comm['appointment_id'] } }
        assert_includes appointment_ids, @appointment1.id
        assert_includes appointment_ids, @appointment2.id
      end

      test "should filter commissions by professional" do
        # Criar segundo profissional
        user2, _ = register_user(email: 'professional2@test.com')
        account_user2 = @account.account_users.create!(user: user2, role: :custom)
        
        # Criar agendamento para o segundo profissional (2 dias atrás, quinta-feira às 10h)
        past_thursday = (Time.current - 1.week).beginning_of_week + 4.days
        start_time3 = past_thursday.beginning_of_day + 10.hours
        
        appointment3 = @account.appointments.create!(
          account_user: account_user2,
          service: @service,
          contact: @contact,
          start_time: start_time3,
          end_time: start_time3 + 1.hour,
          price_cents: 5000,
          whatsapp_number: "5511777777777",
          status: :confirmed,
          payment_status: :paid
        )
        
        # Marcar como completed após criar
        appointment3.update!(status: :completed)
        
        appointment3.appointment_commissions.create!(
          account_user: account_user2,
          commission_type: 0, # percentage
          commission_value: 50.0,
          commission_amount_cents: 2500
        )
        
        get api_v1_commissions_path, 
            params: { professional_id: @account_user.id }, 
            headers: { 'Accept' => 'application/json' }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        # Deve incluir apenas comissões do primeiro profissional
        assert_equal 1, json_response['commissions'].length
        assert_equal @account_user.id, json_response['commissions'].first['professional']['id']
      end

      test "should return summary with correct totals" do
        get api_v1_commissions_path, headers: { 
          'Accept' => 'application/json',
          'Authorization' => "Bearer #{@auth_token}"
        }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        summary = json_response['summary']
        
        assert_equal 5000, summary['total_commissions']['cents']
        assert_equal 1, summary['total_professionals']
        assert_equal 2, summary['total_appointments']
        assert summary.key?('period')
      end

      test "should return bad request for invalid date format" do
        get api_v1_commissions_path, 
            params: { start_date: 'invalid-date' }, 
            headers: { 'Accept' => 'application/json' }
        
        assert_response :bad_request
        json_response = JSON.parse(response.body)
        assert_includes json_response['error'], 'Data inválida'
      end

      # GET /api/v1/commissions/summary
      test "should return commissions summary" do
        get summary_api_v1_commissions_path, headers: { 
          'Accept' => 'application/json',
          'Authorization' => "Bearer #{@auth_token}"
        }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert json_response.key?('summary')
        assert_equal 5000, json_response['summary']['total_commissions']['cents']
        assert_equal 1, json_response['summary']['total_professionals']
        assert json_response['summary'].key?('professionals')
      end

      test "should filter summary by professional" do
        get summary_api_v1_commissions_path, 
            params: { professional_id: @account_user.id }, 
            headers: { 'Accept' => 'application/json' }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert_equal 1, json_response['summary']['professionals'].length
      end

      test "should return forbidden when not authenticated" do
        get api_v1_commissions_path, headers: { 
          'Accept' => 'application/json',
          'Authorization' => "Bearer #{@auth_token}"
        }
        
        assert_response :unauthorized
      end

      test "should include commission details in response" do
        get api_v1_commissions_path, headers: { 
          'Accept' => 'application/json',
          'Authorization' => "Bearer #{@auth_token}"
        }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        commission = json_response['commissions'].first['commissions'].first
        
        assert commission.key?('id')
        assert commission.key?('appointment_id')
        assert commission.key?('service')
        assert commission.key?('client')
        assert commission.key?('date')
        assert commission.key?('appointment_price')
        assert commission.key?('commission_type')
        assert commission.key?('commission_value')
        assert commission.key?('commission_amount')
        assert_equal 'percentage', commission['commission_type']
        assert_equal 50.0, commission['commission_value']
      end
    end
  end
end

