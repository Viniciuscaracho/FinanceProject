# frozen_string_literal: true

module Api
  module V1
    class ProfessionalDocumentTemplatesController < ApplicationController
      before_action :set_professional_document_template, only: [:show, :update, :destroy]

      def index
        # Criar templates padrão se não existirem
        ProfessionalDocumentTemplate.create_default_templates(Current.account) if Current.account.professional_document_templates.empty?

        query = Current.account.professional_document_templates
          .order(created_at: :desc)
          .page(params[:page])
          .per(params[:per_page] || 20)

        # Filtrar por tipo de profissional se fornecido
        query = query.where(professional_type: params[:professional_type]) if params[:professional_type].present?

        render json: {
          templates: query.map { |template| professional_document_template_json(template) },
          meta: {
            current_page: query.current_page,
            total_pages: query.total_pages,
            total_count: query.total_count
          }
        }
      end

      def show
        render json: { template: professional_document_template_json(@professional_document_template) }
      end

      def create
        @professional_document_template = Current.account.professional_document_templates.build(professional_document_template_params)

        if @professional_document_template.save
          render json: { template: professional_document_template_json(@professional_document_template) }, status: :created
        else
          render json: { errors: @professional_document_template.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @professional_document_template.update(professional_document_template_params)
          render json: { template: professional_document_template_json(@professional_document_template) }
        else
          render json: { errors: @professional_document_template.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        if @professional_document_template.default?
          render json: { error: 'Não é possível excluir o template padrão' }, status: :unprocessable_entity
        else
          @professional_document_template.destroy
          render json: { message: 'Template removido com sucesso' }
        end
      end

      private

      def set_professional_document_template
        @professional_document_template = Current.account.professional_document_templates.find(params[:id])
      end

      def professional_document_template_json(template)
        template.as_json(
          only: [:id, :name, :description, :content, :default, :created_at, :updated_at,
                 :enable_sessions, :session_count, :session_number, :session_type, :professional_type]
        ).merge(
          professional_type_label: template.professional_type_label
        )
      end

      def professional_document_template_params
        params.require(:professional_document_template).permit(:name, :description, :content,
                                                                :enable_sessions, :session_count, :session_number,
                                                                :session_type, :professional_type)
      end
    end
  end
end

