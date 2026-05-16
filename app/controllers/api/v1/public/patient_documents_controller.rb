# frozen_string_literal: true

module Api
  module V1
    module Public
      class PatientDocumentsController < ActionController::API
        def show
          doc = PatientDocument.find_by(public_token: params[:token], shared: true)

          return render json: { error: 'Documento não encontrado ou link desativado' }, status: :not_found unless doc

          account = doc.account
          contact = doc.contact

          render json: {
            document: {
              title:         doc.title,
              content:       doc.content,
              document_type: doc.document_type_label,
              updated_at:    doc.updated_at.iso8601
            },
            professional: {
              name:  account.company&.name || account.users.first&.full_name,
              email: account.users.first&.email
            },
            patient: {
              name: contact.name
            }
          }
        end
      end
    end
  end
end
