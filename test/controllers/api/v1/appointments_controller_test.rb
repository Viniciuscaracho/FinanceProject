# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class AppointmentsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user, @account = register_user
        @bank_account = create_bank_account(@account)
        @account_user = @account.account_users.first

        @account_user.update!(
          schedule: {
            'monday'    => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
            'tuesday'   => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
            'wednesday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
            'thursday'  => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
            'friday'    => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 }
          }
        )

        @service  = create_service(@account, name: 'Corte de Cabelo', selling_price_cents: 3000)
        @contact  = create_contact(@account)
        @api_token = create_api_token(@account, @user)
        @auth_token = generate_auth_token(@user)

        # Appointment 1: next Monday 10h – confirmed, paid
        next_monday1 = (Time.current + 1.week).beginning_of_week + 1.day
        start1 = next_monday1.beginning_of_day + 10.hours

        @appointment1 = @account.appointments.create!(
          account_user: @account_user, service: @service, contact: @contact,
          start_time: start1, end_time: start1 + 1.hour,
          price_cents: 3000, whatsapp_number: "5511999999999",
          status: :confirmed, payment_status: :paid
        )

        # Appointment 2: next Monday 12h (different slot) – pending
        start2 = next_monday1.beginning_of_day + 12.hours

        @appointment2 = @account.appointments.create!(
          account_user: @account_user, service: @service, contact: @contact,
          start_time: start2, end_time: start2 + 1.hour,
          price_cents: 3000, whatsapp_number: "5511888888888",
          status: :pending, payment_status: :pending
        )
      end

      # GET /api/v1/appointments

      test "should list appointments when authenticated" do
        get api_v1_appointments_path,
            headers: { 'Accept' => 'application/json', 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        json_response = JSON.parse(response.body)
        assert json_response.is_a?(Array)
        assert_equal 2, json_response.length
      end

      test "should filter appointments by status" do
        get api_v1_appointments_path,
            params: { status: 'confirmed' },
            headers: { 'Accept' => 'application/json', 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        json_response = JSON.parse(response.body)
        assert_equal 1, json_response.length
        assert_equal 'confirmed', json_response.first['status']
      end

      test "should filter appointments by payment_status" do
        get api_v1_appointments_path,
            params: { payment_status: 'paid' },
            headers: { 'Accept' => 'application/json', 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        json_response = JSON.parse(response.body)
        assert_equal 1, json_response.length
        assert_equal 'paid', json_response.first['payment_status']
      end

      test "should filter appointments by professional" do
        get api_v1_appointments_path,
            params: { account_user_id: @account_user.id },
            headers: { 'Accept' => 'application/json', 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        json_response = JSON.parse(response.body)
        assert_equal 2, json_response.length
      end

      test "should return unauthorized when not authenticated" do
        get api_v1_appointments_path, headers: { 'Accept' => 'application/json' }
        assert_response :unauthorized
      end

      # GET /api/v1/appointments/services

      test "should list services" do
        get services_api_v1_appointments_path,
            headers: { 'Accept' => 'application/json', 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        json_response = JSON.parse(response.body)
        assert json_response.is_a?(Array)
        assert_equal 1, json_response.length
        assert_equal @service.name, json_response.first['name']
      end

      # GET /api/v1/appointments/professionals

      test "should list professionals" do
        get professionals_api_v1_appointments_path,
            headers: { 'Accept' => 'application/json', 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        json_response = JSON.parse(response.body)
        assert json_response.is_a?(Array)
        assert_equal 1, json_response.length
      end

      # GET /api/v1/appointments/available_slots (requires API key)

      test "should return available slots for professional" do
        date = (Time.current + 1.week).beginning_of_week + 1.day # next Monday

        get available_slots_api_v1_appointments_path,
            params: { professional_id: @account_user.id, date: date.to_date.iso8601,
                      service_id: @service.id, account_id: @account.id },
            headers: { 'Accept' => 'application/json', 'X-API-Key' => 'dev_api_key_12345' }

        assert_response :success
        json_response = JSON.parse(response.body)
        assert json_response.key?('available_slots')
        assert json_response['available_slots'].is_a?(Array)
      end

      test "should return empty slots when professional does not work on given day" do
        # Saturday is not in the professional's schedule
        date = (Time.current + 1.week).end_of_week.to_date # Saturday

        get available_slots_api_v1_appointments_path,
            params: { professional_id: @account_user.id, date: date.iso8601,
                      account_id: @account.id },
            headers: { 'Accept' => 'application/json', 'X-API-Key' => 'dev_api_key_12345' }

        assert_response :success
        json_response = JSON.parse(response.body)
        assert_equal [], json_response['available_slots']
      end

      # POST /api/v1/appointments (requires API key)

      test "should create appointment with API key" do
        next_tuesday = (Time.current + 1.week).beginning_of_week + 2.days
        start_time   = next_tuesday.beginning_of_day + 10.hours

        assert_difference 'Appointment.count', 1 do
          post api_v1_appointments_path,
               params: {
                 account_id: @account.id,
                 appointment: {
                   account_user_id: @account_user.id,
                   service_id: @service.id,
                   start_time: start_time.iso8601,
                   end_time: (start_time + 1.hour).iso8601,
                   price_cents: 3000,
                   whatsapp_number: "5511666666666"
                 }
               },
               headers: { 'Accept' => 'application/json', 'X-API-Key' => 'dev_api_key_12345' }
        end

        assert_response :success
        json_response = JSON.parse(response.body)
        assert_equal 'pending', json_response['status']
      end

      test "should create contact automatically when creating appointment with new whatsapp_number" do
        next_tuesday = (Time.current + 1.week).beginning_of_week + 2.days
        start_time   = next_tuesday.beginning_of_day + 11.hours

        assert_difference 'Contact.count', 1 do
          post api_v1_appointments_path,
               params: {
                 account_id: @account.id,
                 appointment: {
                   account_user_id: @account_user.id,
                   service_id: @service.id,
                   start_time: start_time.iso8601,
                   end_time: (start_time + 1.hour).iso8601,
                   price_cents: 3000,
                   whatsapp_number: "5511555555555"
                 }
               },
               headers: { 'Accept' => 'application/json', 'X-API-Key' => 'dev_api_key_12345' }
        end

        assert_response :success
        json_response = JSON.parse(response.body)
        assert_not_nil json_response.dig('client', 'id')
      end

      # GET /api/v1/appointments/:id

      test "should show appointment" do
        get api_v1_appointment_path(@appointment1),
            headers: { 'Accept' => 'application/json', 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        json_response = JSON.parse(response.body)
        assert_equal @appointment1.id, json_response['id']
        assert_equal 'confirmed', json_response['status']
      end

      # PATCH /api/v1/appointments/:id

      test "should update appointment status" do
        patch api_v1_appointment_path(@appointment2),
              params: { appointment: { status: 'confirmed' } },
              headers: { 'Accept' => 'application/json', 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        @appointment2.reload
        assert_equal :confirmed, @appointment2.status
      end

      test "should not allow invalid status transition" do
        # confirmed → pending is not allowed
        patch api_v1_appointment_path(@appointment1),
              params: { appointment: { status: 'pending' } },
              headers: { 'Accept' => 'application/json', 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :unprocessable_entity
        @appointment1.reload
        assert_equal :confirmed, @appointment1.status
      end

      # DELETE /api/v1/appointments/:id

      test "should cancel appointment" do
        delete api_v1_appointment_path(@appointment2),
               headers: { 'Accept' => 'application/json', 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        @appointment2.reload
        assert_equal :canceled, @appointment2.status
      end

      test "should cancel paid appointment and refund" do
        @appointment1.update_column(:stripe_payment_intent_id, 'pi_test_123')

        delete api_v1_appointment_path(@appointment1),
               headers: { 'Accept' => 'application/json', 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        @appointment1.reload
        assert_equal :canceled, @appointment1.status
        assert_equal :refunded, @appointment1.payment_status
      end
    end
  end
end
