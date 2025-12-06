# frozen_string_literal: true

module Api
  module V1
    class AccountSettingsController < ApplicationController
      before_action :set_account

      # GET /api/v1/account_settings
      def show
        authorize! :manage, :account_settings
        
        render json: {
          account: account_data(@account)
        }
      end

      # PATCH/PUT /api/v1/account_settings
      def update
        authorize! :manage, :account_settings

        if @account.update(account_params)
          render json: {
            success: true,
            account: account_data(@account),
            message: 'Configurações da empresa atualizadas com sucesso'
          }
        else
          render json: {
            success: false,
            errors: @account.errors.full_messages,
            message: 'Erro ao atualizar configurações da empresa'
          }, status: :unprocessable_entity
        end
      end

      private

      def set_account
        @account = Current.account
      end

      def account_params
        addresses_attributes = %i[id country state city address_line1 address_line2 district postcode]
        company_attributes = [
          :id, :name, :sector_activity_id, :name_natural, :document_1, :document_1_natural, :document_2, :email, :phone_number, :description,
          { addresses_attributes: }
        ]

        params.require(:account).permit(
          :default_currency,
          :country_code,
          :invoice_number_starts_at,
          :invoice_due_days,
          :invoice_tax_percentage,
          :invoice_tax_already_applied,
          { company_attributes: }
        )
      end

      def account_data(account)
        {
          id: account.id,
          prefix_id: account.prefix_id,
          name: account.name,
          account_type: account.account_type,
          default_currency: account.default_currency || 'BRL',
          country_code: account.country_code,
          invoice_number_starts_at: account.invoice_number_starts_at,
          invoice_due_days: account.invoice_due_days,
          invoice_tax_percentage: account.invoice_tax_percentage,
          invoice_tax_already_applied: account.invoice_tax_already_applied,
          company: company_data(account.company)
        }
      end

      def company_data(company)
        return nil unless company

        {
          id: company.id,
          name: company.name,
          name_natural: company.name_natural,
          document_1: company.document_1,
          document_1_natural: company.document_1_natural,
          document_2: company.document_2,
          email: company.email,
          phone_number: company.phone_number,
          description: company.description,
          addresses: company.addresses.map do |address|
            {
              id: address.id,
              country: address.country,
              state: address.state,
              city: address.city,
              address_line1: address.address_line1,
              address_line2: address.address_line2,
              district: address.district,
              postcode: address.postcode
            }
          end
        }
      end
    end
  end
end

