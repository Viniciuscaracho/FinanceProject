# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class PatientDocumentsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user, @account = register_user
        @auth_token = generate_auth_token(@user)
        @contact = create_contact(@account)
        ActsAsTenant.current_tenant = @account
      end

      teardown { ActsAsTenant.current_tenant = nil }

      # ── GET index ─────────────────────────────────────────────────────────────

      test "index returns documents for contact" do
        doc = @account.patient_documents.create!(contact_id: @contact.id, title: 'Plano Maio')

        get api_v1_contact_patient_documents_path(@contact),
            headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        body = JSON.parse(response.body)
        ids = body['documents'].map { |d| d['id'] }
        assert_includes ids, doc.id
      end

      test "index returns 401 without auth" do
        get api_v1_contact_patient_documents_path(@contact)
        assert_response :unauthorized
      end

      test "index does not return other contact documents" do
        other = create_contact(@account)
        @account.patient_documents.create!(contact_id: other.id, title: 'Outro')
        doc = @account.patient_documents.create!(contact_id: @contact.id, title: 'Meu')

        get api_v1_contact_patient_documents_path(@contact),
            headers: { 'Authorization' => "Bearer #{@auth_token}" }

        body = JSON.parse(response.body)
        ids = body['documents'].map { |d| d['id'] }
        assert_includes ids, doc.id
        assert_equal 1, ids.length
      end

      # ── POST create ────────────────────────────────────────────────────────────

      test "create saves document with title and type" do
        assert_difference 'PatientDocument.count', 1 do
          post api_v1_contact_patient_documents_path(@contact),
               params: {
                 patient_document: { title: 'Plano Junho', document_type: 'plano_alimentar' }
               },
               headers: { 'Authorization' => "Bearer #{@auth_token}" },
               as: :json
        end

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal 'Plano Junho', body['document']['title']
        assert_equal 'plano_alimentar', body['document']['document_type']
        assert_not_nil body['document']['public_token']
        assert_equal false, body['document']['shared']
      end

      test "create returns 422 without title" do
        assert_no_difference 'PatientDocument.count' do
          post api_v1_contact_patient_documents_path(@contact),
               params: { patient_document: { title: '' } },
               headers: { 'Authorization' => "Bearer #{@auth_token}" },
               as: :json
        end
        assert_response :unprocessable_entity
      end

      test "create returns 401 without auth" do
        post api_v1_contact_patient_documents_path(@contact), as: :json
        assert_response :unauthorized
      end

      # ── PUT update ─────────────────────────────────────────────────────────────

      test "update changes content" do
        doc = @account.patient_documents.create!(contact_id: @contact.id, title: 'Original')

        put api_v1_contact_patient_document_path(@contact, doc),
            params: { patient_document: { content: '<p>Novo conteúdo</p>' } },
            headers: { 'Authorization' => "Bearer #{@auth_token}" },
            as: :json

        assert_response :success
        doc.reload
        assert_equal '<p>Novo conteúdo</p>', doc.content
      end

      # ── DELETE destroy ─────────────────────────────────────────────────────────

      test "destroy removes document" do
        doc = @account.patient_documents.create!(contact_id: @contact.id, title: 'Para deletar')

        assert_difference 'PatientDocument.count', -1 do
          delete api_v1_contact_patient_document_path(@contact, doc),
                 headers: { 'Authorization' => "Bearer #{@auth_token}" }
        end
        assert_response :success
      end

      # ── POST toggle_shared ─────────────────────────────────────────────────────

      test "toggle_shared ativa o compartilhamento" do
        doc = @account.patient_documents.create!(contact_id: @contact.id, title: 'Doc', shared: false)

        post toggle_shared_api_v1_contact_patient_document_path(@contact, doc),
             headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        body = JSON.parse(response.body)
        assert_equal true, body['document']['shared']
        assert_equal true, doc.reload.shared
      end

      test "toggle_shared desativa o compartilhamento" do
        doc = @account.patient_documents.create!(contact_id: @contact.id, title: 'Doc', shared: true)

        post toggle_shared_api_v1_contact_patient_document_path(@contact, doc),
             headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        body = JSON.parse(response.body)
        assert_equal false, body['document']['shared']
      end

      test "cannot access document from another account" do
        _, other_account = register_user
        ActsAsTenant.current_tenant = other_account
        other_contact = create_contact(other_account)
        other_doc = other_account.patient_documents.create!(contact_id: other_contact.id, title: 'Outro')
        ActsAsTenant.current_tenant = @account

        get api_v1_contact_patient_document_path(@contact, other_doc),
            headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :not_found
      end
    end
  end
end
