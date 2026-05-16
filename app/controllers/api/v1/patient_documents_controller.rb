# frozen_string_literal: true

module Api
  module V1
    class PatientDocumentsController < ApplicationController
      before_action :set_contact
      before_action :set_document, only: %i[show update destroy toggle_shared]

      rescue_from ActiveRecord::RecordNotFound, with: -> { render json: { error: 'Não encontrado' }, status: :not_found }

      def index
        docs = @contact.patient_documents.recent
        render json: { documents: docs.map { |d| document_json(d) } }
      end

      def show
        render json: { document: document_json(@document) }
      end

      def create
        doc = @contact.patient_documents.build(document_params)
        doc.account = Current.account

        if doc.save
          render json: { document: document_json(doc) }, status: :created
        else
          render json: { errors: doc.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @document.update(document_params)
          render json: { document: document_json(@document) }
        else
          render json: { errors: @document.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @document.destroy
        render json: { message: 'Documento removido' }
      end

      def toggle_shared
        @document.update!(shared: !@document.shared)
        render json: { document: document_json(@document) }
      end

      private

      def set_contact
        @contact = Current.account.contacts.find(params[:contact_id])
      end

      def set_document
        @document = @contact.patient_documents.find(params[:id])
      end

      def document_params
        params.require(:patient_document).permit(:title, :content, :document_type, :shared)
      end

      def document_json(doc)
        {
          id:                 doc.id,
          title:              doc.title,
          content:            doc.content,
          document_type:      doc.document_type,
          document_type_label: doc.document_type_label,
          shared:             doc.shared,
          public_token:       doc.public_token,
          created_at:         doc.created_at.iso8601,
          updated_at:         doc.updated_at.iso8601
        }
      end
    end
  end
end
