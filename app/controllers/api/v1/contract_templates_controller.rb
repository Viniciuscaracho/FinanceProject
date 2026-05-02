# frozen_string_literal: true

module Api
  module V1
    class ContractTemplatesController < ApplicationController
      before_action :set_contract_template, only: [:show, :update, :destroy]

      def index
        # Criar templates padrão se não existirem
        ContractTemplate.create_default_templates(Current.account) if Current.account.contract_templates.empty?

        query = Current.account.contract_templates
          .order(created_at: :desc)
          .page(params[:page])
          .per(params[:per_page] || 20)

        render json: {
          templates: query.map { |template| contract_template_json(template) },
          meta: {
            current_page: query.current_page,
            total_pages: query.total_pages,
            total_count: query.total_count
          }
        }
      end

      def show
        render json: { template: contract_template_json(@contract_template) }
      end

      def create
        @contract_template = Current.account.contract_templates.build(contract_template_params)
        @contract_template.settings(:contract).header = contract_template_params_with_settings[:show_header] == true if contract_template_params_with_settings.key?(:show_header)

        if @contract_template.save
          render json: { template: contract_template_json(@contract_template) }, status: :created
        else
          render json: { errors: @contract_template.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        @contract_template.settings(:contract).header = contract_template_params_with_settings[:show_header] == true if contract_template_params_with_settings.key?(:show_header)

        if @contract_template.update(contract_template_params)
          render json: { template: contract_template_json(@contract_template) }
        else
          render json: { errors: @contract_template.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        if @contract_template.default?
          render json: { error: 'Não é possível excluir o template padrão' }, status: :unprocessable_entity
        else
          @contract_template.destroy
          render json: { message: 'Template removido com sucesso' }
        end
      end

      private

      def set_contract_template
        @contract_template = Current.account.contract_templates.find(params[:id])
      end

      def contract_template_json(template)
        template.as_json(
          only: [:id, :name, :description, :content, :default, :created_at, :updated_at,
                 :enable_sessions, :session_count, :session_number, :session_type, :professional_type]
        ).merge(
          show_header: template.settings(:contract).header,
          professional_type_label: template.professional_type_label
        )
      end

      def contract_template_params
        params.require(:contract_template).permit(:name, :description, :content,
                                                   :enable_sessions, :session_count, :session_number, 
                                                   :session_type, :professional_type)
      end

      def contract_template_params_with_settings
        params[:contract_template] || {}
      end
    end
  end
end

