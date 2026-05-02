# frozen_string_literal: true

module Api
  module V1
    class InvoiceTemplatesController < ApplicationController
      before_action :set_invoice_template, only: [:show, :update, :destroy]

      def index
        # Criar template padrão se não existir
        InvoiceTemplate.create_default_invoice_template(Current.account) unless Current.account.invoice_templates.exists?

        query = Current.account.invoice_templates
          .order(created_at: :desc)
          .page(params[:page])
          .per(params[:per_page] || 20)

        render json: {
          templates: query.map { |template| invoice_template_json(template) },
          meta: {
            current_page: query.current_page,
            total_pages: query.total_pages,
            total_count: query.total_count
          }
        }
      end

      def show
        render json: { template: invoice_template_json(@invoice_template) }
      end

      def create
        @invoice_template = Current.account.invoice_templates.build(invoice_template_params)
        
        # Aplicar settings usando o método assign_settings
        settings_data = invoice_template_params_with_settings[:settings]
        if settings_data.present?
          # Converter chaves string para símbolos
          settings_hash = settings_data.is_a?(ActionController::Parameters) ? 
                         settings_data.to_unsafe_h.symbolize_keys : 
                         settings_data.symbolize_keys rescue settings_data
          @invoice_template.assign_settings(settings_hash)
        end

        if @invoice_template.save
          render json: { template: invoice_template_json(@invoice_template) }, status: :created
        else
          render json: { errors: @invoice_template.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        # Aplicar settings usando o método assign_settings
        settings_data = invoice_template_params_with_settings[:settings]
        if settings_data.present?
          # Converter chaves string para símbolos
          settings_hash = settings_data.is_a?(ActionController::Parameters) ? 
                         settings_data.to_unsafe_h.symbolize_keys : 
                         settings_data.symbolize_keys rescue settings_data
          @invoice_template.assign_settings(settings_hash)
        end

        if @invoice_template.update(invoice_template_params)
          render json: { template: invoice_template_json(@invoice_template) }
        else
          render json: { errors: @invoice_template.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        if @invoice_template.default?
          render json: { error: 'Não é possível excluir o template padrão' }, status: :unprocessable_entity
        else
          @invoice_template.destroy
          render json: { message: 'Template removido com sucesso' }
        end
      end

      private

      def set_invoice_template
        @invoice_template = Current.account.invoice_templates.find(params[:id])
      end

      def invoice_template_json(template)
        template.as_json(
          only: [:id, :name, :description, :content, :default, :created_at, :updated_at,
                 :enable_sessions, :session_count, :session_number, :session_type, :professional_type]
        ).merge(
          show_header: template.show_header,
          show_issue_date: template.show_issue_date,
          show_due_date: template.show_due_date,
          show_recipient: template.show_recipient,
          show_detailed_lines: template.show_detailed_lines,
          show_discount_info: template.show_discount_info,
          show_tax_info: template.show_tax_info,
          show_payment_info: template.show_payment_info,
          professional_type_label: template.professional_type_label
        )
      end

      def invoice_template_params
        params.require(:invoice_template).permit(:name, :description, :content, 
                                                  :enable_sessions, :session_count, :session_number, 
                                                  :session_type, :professional_type)
      end

      def invoice_template_params_with_settings
        params[:invoice_template] || {}
      end
    end
  end
end

