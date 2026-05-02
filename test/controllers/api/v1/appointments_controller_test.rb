# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class AppointmentsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user, @account = register_user
        @bank_account = create_bank_account(@account)
        @account_user = @account.account_users.first
        
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
        
        @service = create_service(@account, name: 'Corte de Cabelo', selling_price_cents: 3000)
        @contact = create_contact(@account)
        
        # Criar API token para testes de endpoints públicos
        @api_token = create_api_token(@account, @user)
        
        # Criar alguns agendamentos de teste (próximas segundas-feiras)
        next_monday1 = (Time.current + 1.week).beginning_of_week + 1.day
        start_time1 = next_monday1.beginning_of_day + 10.hours
        
        @appointment1 = @account.appointments.create!(
          account_user: @account_user,
          service: @service,
          contact: @contact,
          start_time: start_time1,
          end_time: start_time1 + 1.hour,
          price_cents: 3000,
          whatsapp_number: "5511999999999",
          status: :confirmed,
          payment_status: :paid
        )
        
        next_monday2 = (Time.current + 1.week).beginning_of_week + 1.day + 1.week
        start_time2 = next_monday2.beginning_of_day + 10.hours
        
        @appointment2 = @account.appointments.create!(
          account_user: @account_user,
          service: @service,
          contact: @contact,
          start_time: start_time2,
          end_time: start_time2 + 1.hour,
          price_cents: 3000,
          whatsapp_number: "5511888888888",
          status: :pending,
          payment_status: :pending
        )
      end

      # GET /api/v1/appointments
      test "should list appointments when authenticated" do
        auth_token = generate_auth_token(@user)
        get api_v1_appointments_path, headers: { 
          'Accept' => 'application/json',
          'Authorization' => "Bearer #{auth_token}"
        }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert json_response.is_a?(Array)
        assert_equal 2, json_response.length
      end

      test "should filter appointments by status" do
        auth_token = generate_auth_token(@user)
        get api_v1_appointments_path, 
            params: { status: 'confirmed' }, 
            headers: { 
              'Accept' => 'application/json',
              'Authorization' => "Bearer #{auth_token}"
            }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert_equal 1, json_response.length
        assert_equal 'confirmed', json_response.first['status']
      end

      test "should filter appointments by payment_status" do
        auth_token = generate_auth_token(@user)
        get api_v1_appointments_path, 
            params: { payment_status: 'paid' }, 
            headers: { 
              'Accept' => 'application/json',
              'Authorization' => "Bearer #{auth_token}"
            }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert_equal 1, json_response.length
        assert_equal 'paid', json_response.first['payment_status']
      end

      test "should filter appointments by professional" do
        auth_token = generate_auth_token(@user)
        get api_v1_appointments_path, 
            params: { account_user_id: @account_user.id }, 
            headers: { 
              'Accept' => 'application/json',
              'Authorization' => "Bearer #{auth_token}"
            }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert_equal 2, json_response.length
      end

      test "should return forbidden when not authenticated" do
        get api_v1_appointments_path, headers: { 'Accept' => 'application/json' }
        
        assert_response :unauthorized
      end

      # GET /api/v1/appointments/services
      test "should list services" do
        auth_token = generate_auth_token(@user)
        get services_api_v1_appointments_path, 
            headers: { 
              'Accept' => 'application/json',
              'Authorization' => "Bearer #{auth_token}"
            }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert json_response.is_a?(Array)
        assert_equal 1, json_response.length
        assert_equal @service.name, json_response.first['name']
      end

      # GET /api/v1/appointments/professionals
      test "should list professionals" do
        auth_token = generate_auth_token(@user)
        get professionals_api_v1_appointments_path, 
            headers: { 
              'Accept' => 'application/json',
              'Authorization' => "Bearer #{auth_token}"
            }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert json_response.is_a?(Array)
        assert_equal 1, json_response.length
      end

      # GET /api/v1/appointments/available_slots
      test "should return available slots for professional" do
        # Configurar horário de trabalho do profissional
        @account_user.update!(
          schedule: {
            'monday' => { 'enabled' => true, 'start_time' => '09:00', 'end_time' => '18:00' }
          }
        )
        
        date = (Time.current + 1.week).beginning_of_week + 1.day # Próxima segunda-feira
        
        auth_token = generate_auth_token(@user)
        headers = { 
          'Accept' => 'application/json',
          'Authorization' => "Bearer #{auth_token}"
        }
        get available_slots_api_v1_appointments_path, 
            params: { 
              professional_id: @account_user.id, 
              date: date.to_date.iso8601,
              service_id: @service.id
            }, 
            headers: { 'Accept' => 'application/json' }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert json_response.key?('available_slots')
        assert json_response['available_slots'].is_a?(Array)
      end

      test "should return empty slots when professional does not work on date" do
        # Profissional não trabalha aos domingos
        @account_user.update!(
          schedule: {
            'sunday' => { 'enabled' => false }
          }
        )
        
        date = (Time.current + 1.week).beginning_of_week # Domingo
        
        auth_token = generate_auth_token(@user)
        headers = { 
          'Accept' => 'application/json',
          'Authorization' => "Bearer #{auth_token}"
        }
        get available_slots_api_v1_appointments_path, 
            params: { 
              professional_id: @account_user.id, 
              date: date.to_date.iso8601
            }, 
            headers: { 'Accept' => 'application/json' }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert_equal [], json_response['available_slots']
      end

      test "should exclude occupied slots from available slots" do
        # Configurar horário de trabalho
        @account_user.update!(
          schedule: {
            'monday' => { 'enabled' => true, 'start_time' => '09:00', 'end_time' => '18:00' }
          }
        )
        
        date = (Time.current + 1.week).beginning_of_week + 1.day # Segunda-feira
        
        # Criar agendamento ocupando um horário
        occupied_time = date.beginning_of_day + 10.hours
        @account.appointments.create!(
          account_user: @account_user,
          service: @service,
          contact: @contact,
          start_time: occupied_time,
          end_time: occupied_time + 1.hour,
          price_cents: 3000,
          whatsapp_number: "5511777777777",
          status: :confirmed
        )
        
        auth_token = generate_auth_token(@user)
        headers = { 
          'Accept' => 'application/json',
          'Authorization' => "Bearer #{auth_token}"
        }
        get available_slots_api_v1_appointments_path, 
            params: { 
              professional_id: @account_user.id, 
              date: date.to_date.iso8601,
              service_id: @service.id
            }, 
            headers: { 'Accept' => 'application/json' }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        slots = json_response['available_slots']
        
        # Verificar que o horário ocupado não está na lista
        occupied_slot = slots.find { |s| Time.parse(s['start_time']) == occupied_time }
        assert_nil occupied_slot
      end

      # POST /api/v1/appointments (com API key)
      test "should create appointment with API key" do
        # Próxima segunda-feira às 10h
        next_monday = (Time.current + 1.week).beginning_of_week + 1.day
        start_time = next_monday.beginning_of_day + 10.hours
        
        appointment_params = {
          account_user_id: @account_user.id,
          service_id: @service.id,
          start_time: start_time.iso8601,
          end_time: (start_time + 1.hour).iso8601,
          price_cents: 3000,
          whatsapp_number: "5511666666666"
        }
        
        assert_difference 'Appointment.count', 1 do
          post api_v1_appointments_path,
               params: { appointment: appointment_params },
               headers: { 
                 'Accept' => 'application/json',
                 'Authorization' => "Bearer #{@api_token.token}"
               }
        end
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert_equal 'pending', json_response['status']
        assert_equal 'pending', json_response['payment_status']
      end

      test "should create contact automatically when creating appointment with whatsapp_number" do
        # Próxima segunda-feira às 10h
        next_monday = (Time.current + 1.week).beginning_of_week + 1.day
        start_time = next_monday.beginning_of_day + 10.hours
        
        appointment_params = {
          account_user_id: @account_user.id,
          service_id: @service.id,
          start_time: start_time.iso8601,
          end_time: (start_time + 1.hour).iso8601,
          price_cents: 3000,
          whatsapp_number: "5511555555555"
        }
        
        assert_difference 'Contact.count', 1 do
          post api_v1_appointments_path,
               params: { appointment: appointment_params },
               headers: { 
                 'Accept' => 'application/json',
                 'Authorization' => "Bearer #{@api_token.token}"
               }
        end
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert_not_nil json_response['contact_id']
      end

      test "should create recurring appointments when recurrence_pattern provided" do
        # Próxima segunda-feira às 10h
        next_monday = (Time.current + 1.week).beginning_of_week + 1.day
        start_time = next_monday.beginning_of_day + 10.hours
        
        appointment_params = {
          account_user_id: @account_user.id,
          service_id: @service.id,
          start_time: start_time.iso8601,
          end_time: (start_time + 1.hour).iso8601,
          price_cents: 3000,
          whatsapp_number: "5511444444444"
        }
        
        recurrence_pattern = {
          'frequency' => 'weekly',
          'occurrences' => 4
        }
        
        assert_difference 'Appointment.count', 4 do # 1 parent + 3 recurring
          post api_v1_appointments_path,
               params: { 
                 appointment: appointment_params,
                 recurrence_pattern: recurrence_pattern
               },
               headers: { 
                 'Accept' => 'application/json',
                 'Authorization' => "Bearer #{@api_token.token}"
               }
        end
        
        assert_response :success
      end

      test "should generate google meet link when enable_google_meet is true" do
        # Próxima segunda-feira às 10h
        next_monday = (Time.current + 1.week).beginning_of_week + 1.day
        start_time = next_monday.beginning_of_day + 10.hours
        
        appointment_params = {
          account_user_id: @account_user.id,
          service_id: @service.id,
          start_time: start_time.iso8601,
          end_time: (start_time + 1.hour).iso8601,
          price_cents: 3000,
          whatsapp_number: "5511333333333"
        }
        
        Appointments::GenerateGoogleMeetLink.expects(:call).once.returns(
          OpenStruct.new(success?: true, google_meet_link: 'https://meet.google.com/test-link')
        )
        
        post api_v1_appointments_path,
             params: { 
               appointment: appointment_params,
               enable_google_meet: true
             },
             headers: { 
               'Accept' => 'application/json',
               'Authorization' => "Bearer #{@api_token.token}"
             }
        
        assert_response :success
      end

      # GET /api/v1/appointments/:id
      test "should show appointment" do
        auth_token = generate_auth_token(@user)
        get api_v1_appointment_path(@appointment1), 
            headers: { 
              'Accept' => 'application/json',
              'Authorization' => "Bearer #{auth_token}"
            }
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert_equal @appointment1.id, json_response['id']
        assert_equal 'confirmed', json_response['status']
      end

      # PATCH /api/v1/appointments/:id
      test "should update appointment" do
        auth_token = generate_auth_token(@user)
        patch api_v1_appointment_path(@appointment2),
              params: { appointment: { status: 'confirmed', payment_status: 'paid' } },
              headers: { 
                'Accept' => 'application/json',
                'Authorization' => "Bearer #{auth_token}"
              }
        
        assert_response :success
        @appointment2.reload
        assert_equal :confirmed, @appointment2.status
        assert_equal :paid, @appointment2.payment_status
      end

      test "should not allow invalid status transition" do
        auth_token = generate_auth_token(@user)
        patch api_v1_appointment_path(@appointment1),
              params: { appointment: { status: 'pending' } },
              headers: { 
                'Accept' => 'application/json',
                'Authorization' => "Bearer #{auth_token}"
              }
        
        assert_response :unprocessable_entity
      end

      # DELETE /api/v1/appointments/:id
      test "should cancel appointment" do
        auth_token = generate_auth_token(@user)
        delete api_v1_appointment_path(@appointment2), 
               headers: { 
                 'Accept' => 'application/json',
                 'Authorization' => "Bearer #{auth_token}"
               }
        
        assert_response :success
        @appointment2.reload
        assert_equal :canceled, @appointment2.status
      end

      test "should process refund when canceling paid appointment" do
        # Mock do serviço de reembolso
        Appointments::ProcessRefund.expects(:call).once.returns(
          OpenStruct.new(success?: true)
        )
        
        @appointment1.update!(stripe_payment_intent_id: 'pi_test_123')
        
        auth_token = generate_auth_token(@user)
        delete api_v1_appointment_path(@appointment1), 
               headers: { 
                 'Accept' => 'application/json',
                 'Authorization' => "Bearer #{auth_token}"
               }
        
        assert_response :success
        @appointment1.reload
        assert_equal :canceled, @appointment1.status
        assert_equal :refunded, @appointment1.payment_status
      end
    end
  end
end

