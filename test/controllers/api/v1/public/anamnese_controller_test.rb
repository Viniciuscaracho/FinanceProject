# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    module Public
      class AnamneseControllerTest < ActionDispatch::IntegrationTest
        setup do
          @user, @account = register_user
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
            price_cents: 15_000, whatsapp_number: '5511900000099',
            status: :confirmed, payment_status: :pending
          )

          @template = @account.anamnese_templates.create!(
            name: 'Anamnese Geral',
            fields: [
              { 'id' => 'f1', 'label' => 'Queixa principal', 'type' => 'textarea', 'required' => true, 'options' => [] },
              { 'id' => 'f2', 'label' => 'Peso (kg)', 'type' => 'number', 'required' => true, 'options' => [] },
            ]
          )
        end

        teardown { ActsAsTenant.current_tenant = nil }

        # ── GET /api/v1/public/anamnese/:token ────────────────────────────────

        test "show returns 404 for invalid token" do
          get "/api/v1/public/anamnese/token_invalido_xyz"
          assert_response :not_found
          assert_equal 'Link inválido ou expirado', JSON.parse(response.body)['error']
        end

        test "show returns appointment info, template and nil response when unfilled" do
          @appointment.update!(anamnese_template: @template)

          get "/api/v1/public/anamnese/#{@appointment.manage_token}"

          assert_response :success
          body = JSON.parse(response.body)

          assert_equal @appointment.id,       body['appointment']['id']
          assert_equal @service.name,         body['appointment']['service_name']
          assert_equal @template.id,          body['template']['id']
          assert_nil   body['response']
          assert_equal false,                 body['filled']
        end

        test "show falls back to first active account template when appointment has none" do
          get "/api/v1/public/anamnese/#{@appointment.manage_token}"

          assert_response :success
          body = JSON.parse(response.body)
          assert_equal @template.id, body['template']['id']
        end

        test "show returns filled true and response when already submitted" do
          @appointment.update!(anamnese_template: @template)
          @account.anamnese_responses.create!(
            appointment: @appointment, anamnese_template: @template,
            responses: { 'f1' => 'Emagrecer', 'f2' => '78' }
          )

          get "/api/v1/public/anamnese/#{@appointment.manage_token}"

          assert_response :success
          body = JSON.parse(response.body)
          assert_equal true, body['filled']
          assert_equal 'Emagrecer', body['response']['responses']['f1']
        end

        test "show returns nil template when account has no active templates" do
          @template.update!(active: false)

          get "/api/v1/public/anamnese/#{@appointment.manage_token}"

          assert_response :success
          body = JSON.parse(response.body)
          assert_nil body['template']
        end

        test "show does not require authentication" do
          # No Authorization header — must still succeed
          get "/api/v1/public/anamnese/#{@appointment.manage_token}"
          assert_response :success
        end

        # ── POST /api/v1/public/anamnese/:token ───────────────────────────────

        test "create saves a new response" do
          @appointment.update!(anamnese_template: @template)

          assert_difference 'AnamneseResponse.count', 1 do
            post "/api/v1/public/anamnese/#{@appointment.manage_token}",
                 params: {
                   anamnese_response: {
                     anamnese_template_id: @template.id,
                     responses: { 'f1' => 'Perder peso', 'f2' => '90' }
                   }
                 },
                 as: :json
          end

          assert_response :created
          body = JSON.parse(response.body)
          assert_equal 'Perder peso', body['response']['responses']['f1']
        end

        test "create sets filled_at timestamp" do
          post "/api/v1/public/anamnese/#{@appointment.manage_token}",
               params: { anamnese_response: { responses: { 'f1' => 'ok', 'f2' => '60' } } },
               as: :json

          assert_not_nil AnamneseResponse.last.filled_at
        end

        test "create updates existing response (upsert)" do
          @account.anamnese_responses.create!(
            appointment: @appointment, responses: { 'f1' => 'antigo', 'f2' => '70' }
          )

          assert_no_difference 'AnamneseResponse.count' do
            post "/api/v1/public/anamnese/#{@appointment.manage_token}",
                 params: { anamnese_response: { responses: { 'f1' => 'novo', 'f2' => '72' } } },
                 as: :json
          end

          assert_response :success
          assert_equal 'novo', AnamneseResponse.find_by(appointment: @appointment).responses['f1']
        end

        test "create returns 404 for invalid token" do
          post "/api/v1/public/anamnese/token_fake_999",
               params: { anamnese_response: { responses: {} } },
               as: :json

          assert_response :not_found
        end

        test "create does not require authentication" do
          post "/api/v1/public/anamnese/#{@appointment.manage_token}",
               params: { anamnese_response: { responses: { 'f1' => 'ok', 'f2' => '65' } } },
               as: :json

          assert_response :created
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
end
