# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class AnamneseTemplatesControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user, @account = register_user
        @auth_token = generate_auth_token(@user)
        ActsAsTenant.current_tenant = @account

        @template = @account.anamnese_templates.create!(
          name: 'Anamnese Nutricional',
          description: 'Formulário inicial',
          fields: [
            { 'id' => SecureRandom.uuid, 'label' => 'Peso (kg)', 'type' => 'number', 'required' => true, 'options' => [] },
            { 'id' => SecureRandom.uuid, 'label' => 'Objetivo', 'type' => 'select', 'required' => true,
              'options' => ['Emagrecimento', 'Ganho de massa'] },
          ]
        )
      end

      teardown { ActsAsTenant.current_tenant = nil }

      # ── GET /api/v1/anamnese_templates ────────────────────────────────────────

      test "index returns templates for the account" do
        get api_v1_anamnese_templates_path,
            headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        body = JSON.parse(response.body)
        assert_equal 1, body['templates'].length
        assert_equal 'Anamnese Nutricional', body['templates'].first['name']
      end

      test "index does not return inactive templates" do
        @template.update!(active: false)

        get api_v1_anamnese_templates_path,
            headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        body = JSON.parse(response.body)
        assert_empty body['templates']
      end

      test "index returns 401 without auth" do
        get api_v1_anamnese_templates_path
        assert_response :unauthorized
      end

      test "index does not return templates from other accounts" do
        _, other = register_user
        ActsAsTenant.current_tenant = other
        other.anamnese_templates.create!(name: 'Outro', fields: [])
        ActsAsTenant.current_tenant = @account

        get api_v1_anamnese_templates_path,
            headers: { 'Authorization' => "Bearer #{@auth_token}" }

        body = JSON.parse(response.body)
        assert_equal 1, body['templates'].length
      end

      # ── GET /api/v1/anamnese_templates/:id ────────────────────────────────────

      test "show returns the template" do
        get api_v1_anamnese_template_path(@template),
            headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        body = JSON.parse(response.body)
        assert_equal @template.id, body['template']['id']
        assert_equal 2, body['template']['fields'].length
      end

      test "show returns 404 for unknown template" do
        get api_v1_anamnese_template_path(id: 999_999),
            headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :not_found
      end

      # ── POST /api/v1/anamnese_templates ───────────────────────────────────────

      test "create creates a new template" do
        assert_difference 'AnamneseTemplate.count', 1 do
          post api_v1_anamnese_templates_path,
               params: {
                 anamnese_template: {
                   name: 'Comportamento Alimentar',
                   description: 'Avaliação emocional',
                   fields: [{ id: SecureRandom.uuid, label: 'Come por ansiedade?', type: 'checkbox', required: true, options: [] }]
                 }
               },
               headers: { 'Authorization' => "Bearer #{@auth_token}" },
               as: :json
        end

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal 'Comportamento Alimentar', body['template']['name']
      end

      test "create returns 422 when name is blank" do
        assert_no_difference 'AnamneseTemplate.count' do
          post api_v1_anamnese_templates_path,
               params: { anamnese_template: { name: '', fields: [] } },
               headers: { 'Authorization' => "Bearer #{@auth_token}" },
               as: :json
        end

        assert_response :unprocessable_entity
        body = JSON.parse(response.body)
        assert body['errors'].any?
      end

      # ── PATCH /api/v1/anamnese_templates/:id ──────────────────────────────────

      test "update changes the template name" do
        patch api_v1_anamnese_template_path(@template),
              params: { anamnese_template: { name: 'Novo Nome', fields: @template.fields } },
              headers: { 'Authorization' => "Bearer #{@auth_token}" },
              as: :json

        assert_response :success
        assert_equal 'Novo Nome', @template.reload.name
      end

      # ── DELETE /api/v1/anamnese_templates/:id ─────────────────────────────────

      test "destroy archives the template (sets active to false)" do
        delete api_v1_anamnese_template_path(@template),
               headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        assert_not @template.reload.active?
      end

      test "destroy does not delete the record from the database" do
        assert_no_difference 'AnamneseTemplate.count' do
          delete api_v1_anamnese_template_path(@template),
                 headers: { 'Authorization' => "Bearer #{@auth_token}" }
        end
      end
    end
  end
end
