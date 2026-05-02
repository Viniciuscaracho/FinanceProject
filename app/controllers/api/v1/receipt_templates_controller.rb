# frozen_string_literal: true

module Api
  module V1
    class ReceiptTemplatesController < ApplicationController
      before_action :set_receipt_template, only: [:show, :update, :destroy]

      def index
        query = Current.account.receipt_templates
          .order(created_at: :desc)
          .page(params[:page])
          .per(params[:per_page] || 20)

        render json: {
          templates: query.map { |template| receipt_template_json(template) },
          meta: {
            current_page: query.current_page,
            total_pages: query.total_pages,
            total_count: query.total_count
          }
        }
      end

      def show
        render json: { template: receipt_template_json(@receipt_template) }
      end

      def create
        @receipt_template = Current.account.receipt_templates.build(receipt_template_params)
        @receipt_template.settings(:receipt).header = receipt_template_params_with_settings[:show_header] == true

        if @receipt_template.save
          render json: { template: receipt_template_json(@receipt_template) }, status: :created
        else
          render json: { errors: @receipt_template.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        @receipt_template.settings(:receipt).header = receipt_template_params_with_settings[:show_header] == true if receipt_template_params_with_settings.key?(:show_header)

        if @receipt_template.update(receipt_template_params)
          render json: { template: receipt_template_json(@receipt_template) }
        else
          render json: { errors: @receipt_template.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        if @receipt_template.default?
          render json: { error: 'Não é possível excluir o template padrão' }, status: :unprocessable_entity
        else
          @receipt_template.destroy
          render json: { message: 'Template removido com sucesso' }
        end
      end

      private

      def set_receipt_template
        @receipt_template = Current.account.receipt_templates.find(params[:id])
      end

      def receipt_template_json(template)
        template.as_json(
          only: [:id, :name, :description, :content, :default, :transaction_type_cd, :created_at, :updated_at,
                 :enable_sessions, :session_count, :session_number, :session_type, :professional_type]
        ).merge(
          show_header: template.show_header?,
          transaction_type: template.transaction_type&.to_s,
          transaction_type_cd: template.transaction_type_cd,
          professional_type_label: template.professional_type_label
        )
      end

      def receipt_template_params
        params.require(:receipt_template).permit(:name, :description, :content, :transaction_type_cd, 
                                                  :enable_sessions, :session_count, :session_number, 
                                                  :session_type, :professional_type)
      end

      def receipt_template_params_with_settings
        params[:receipt_template] || {}
      end
    end
  end
end

