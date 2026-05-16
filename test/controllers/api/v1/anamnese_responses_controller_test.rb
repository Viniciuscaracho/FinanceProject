# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class AnamneseResponsesControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user, @account = register_user
        @auth_token = generate_auth_token(@user)
        @account_user = @account.account_users.first
        @account_user.update!(
          schedule: {
            'monday'    => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
            'tuesday'   => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
            'wednesday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
            'thursday'  => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
            'friday'    => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
          }
        )
        @service = create_service(@account)
        @contact = create_contact(@account)
        ActsAsTenant.current_tenant = @account

        t = next_weekday_at(10)
        @appointment = @account.appointments.create!(
          account_user: @account_user, service: @service, contact: @contact,
          start_time: t, end_time: t + 1.hour,
          price_cents: 5000, whatsapp_number: '5511900000001',
          status: :confirmed, payment_status: :paid
        )

        @template = @account.anamnese_templates.create!(
          name: 'Nutricional', fields: [
            { 'id' => 'f1', 'label' => 'Peso', 'type' => 'number', 'required' => true, 'options' => [] }
          ]
        )
      end

      teardown { ActsAsTenant.current_tenant = nil }

      # ── GET /api/v1/appointments/:id/anamnese_response ────────────────────────

      test "show returns null when no response exists" do
        get api_v1_appointment_anamnese_response_path(@appointment),
            headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        body = JSON.parse(response.body)
        assert_nil body['response']
      end

      test "show returns existing response with template" do
        resp = @account.anamnese_responses.create!(
          appointment: @appointment, anamnese_template: @template,
          responses: { 'f1' => '72' }
        )

        get api_v1_appointment_anamnese_response_path(@appointment),
            headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        body = JSON.parse(response.body)
        assert_equal resp.id, body['response']['id']
        assert_equal '72', body['response']['responses']['f1']
        assert_equal @template.id, body['response']['anamnese_template']['id']
      end

      test "show returns 401 without auth" do
        get api_v1_appointment_anamnese_response_path(@appointment)
        assert_response :unauthorized
      end

      # ── POST /api/v1/appointments/:id/anamnese_response ───────────────────────

      test "create saves a new anamnese response" do
        assert_difference 'AnamneseResponse.count', 1 do
          post api_v1_appointment_anamnese_response_path(@appointment),
               params: {
                 anamnese_response: {
                   anamnese_template_id: @template.id,
                   responses: { 'f1' => '80' }
                 }
               },
               headers: { 'Authorization' => "Bearer #{@auth_token}" },
               as: :json
        end

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal '80', body['response']['responses']['f1']
        assert_not_nil AnamneseResponse.last.filled_at
      end

      test "create sets contact_id from appointment" do
        post api_v1_appointment_anamnese_response_path(@appointment),
             params: { anamnese_response: { responses: { 'f1' => '75' } } },
             headers: { 'Authorization' => "Bearer #{@auth_token}" },
             as: :json

        assert_equal @contact.id, AnamneseResponse.last.contact_id
      end

      test "create upserts when response already exists" do
        @account.anamnese_responses.create!(appointment: @appointment, responses: { 'f1' => '70' })

        assert_no_difference 'AnamneseResponse.count' do
          post api_v1_appointment_anamnese_response_path(@appointment),
               params: { anamnese_response: { responses: { 'f1' => '75' } } },
               headers: { 'Authorization' => "Bearer #{@auth_token}" },
               as: :json
        end

        assert_response :success
        body = JSON.parse(response.body)
        assert_equal '75', body['response']['responses']['f1']
      end

      test "create returns 401 without auth" do
        post api_v1_appointment_anamnese_response_path(@appointment), as: :json
        assert_response :unauthorized
      end

      private

      def next_weekday_at(hour)
        t = Time.current + 1.day
        t += 1.day while [0, 6].include?(t.wday)
        t.beginning_of_day + hour.hours
      end
    end
  end
end
