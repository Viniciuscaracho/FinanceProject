# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    module Public
      class PatientDocumentsControllerTest < ActionDispatch::IntegrationTest
        setup do
          _, @account = register_user
          @contact = create_contact(@account)
          ActsAsTenant.current_tenant = @account

          @doc = @account.patient_documents.create!(
            contact_id:    @contact.id,
            title:         'Plano Alimentar Maio',
            content:       '<p>Coma bem!</p>',
            document_type: 'plano_alimentar',
            shared:        true
          )
        end

        teardown { ActsAsTenant.current_tenant = nil }

        test "show returns document when shared and token valid" do
          get "/api/v1/public/documents/#{@doc.public_token}"

          assert_response :success
          body = JSON.parse(response.body)
          assert_equal 'Plano Alimentar Maio', body['document']['title']
          assert_equal '<p>Coma bem!</p>', body['document']['content']
          assert_equal 'Plano Alimentar', body['document']['document_type']
          assert_not_nil body['patient']['name']
          assert_not_nil body['professional']
        end

        test "show returns 404 for invalid token" do
          get "/api/v1/public/documents/token_invalido_xyz"
          assert_response :not_found
        end

        test "show returns 404 when document is not shared" do
          @doc.update!(shared: false)
          get "/api/v1/public/documents/#{@doc.public_token}"
          assert_response :not_found
        end

        test "show does not require authentication" do
          get "/api/v1/public/documents/#{@doc.public_token}"
          assert_response :success
        end
      end
    end
  end
end
