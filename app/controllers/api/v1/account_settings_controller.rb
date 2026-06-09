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

        if @account.update(inject_company_id(sanitized_params))
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

      # PATCH /api/v1/account_settings/upload_logo
      def upload_logo
        authorize! :manage, :account_settings
        company = @account.company
        return render json: { error: 'Empresa não encontrada' }, status: :not_found unless company

        if params[:logo].present?
          attach_image_directly(company, :logo, params[:logo])
          render json: { success: true, logo_url: logo_url_for(company.reload) }
        else
          render json: { error: 'Nenhuma imagem enviada' }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/account_settings/upload_cover
      def upload_cover
        authorize! :manage, :account_settings
        company = @account.company
        return render json: { error: 'Empresa não encontrada' }, status: :not_found unless company

        if params[:cover].present?
          attach_image_directly(company, :cover_image, params[:cover])
          render json: { success: true, cover_url: cover_url_for(company.reload) }
        else
          render json: { error: 'Nenhuma imagem enviada' }, status: :unprocessable_entity
        end
      end

      private

      def set_account
        @account = Current.account
      end

      # Ensures company_attributes always carries the existing company id so
      # accepts_nested_attributes_for updates (not creates) the company record.
      # Also keeps document_1/document_1_natural in sync so the NaturalPerson
      # concern's before_validation callback doesn't overwrite a new document_1
      # with the stale value that after_initialize set on document_1_natural.
      def inject_company_id(params)
        return params unless params[:company_attributes].present? && @account.company_id.present?
        ca = params[:company_attributes]
        ca[:id] ||= @account.company_id
        ca[:document_1_natural] ||= ca[:document_1] if ca[:document_1].present?
        ca[:document_1]         ||= ca[:document_1_natural] if ca[:document_1_natural].present?
        params
      end

      # Strip address IDs that don't belong to the current company so stale
      # frontend state can never trigger a nested_attributes not-found error.
      def sanitized_params
        p = account_params
        company_attrs = p[:company_attributes]
        return p unless company_attrs&.key?(:addresses_attributes)

        company = @account.company
        valid_ids = company ? company.addresses.pluck(:id).map(&:to_s) : []

        company_attrs[:addresses_attributes] = company_attrs[:addresses_attributes].map do |addr|
          addr[:id].present? && !valid_ids.include?(addr[:id].to_s) ? addr.except(:id) : addr
        end

        p
      end

      def account_params
        addresses_attributes = %i[id country state city address_line1 address_line2 district postcode]
        company_attributes = [
          :id, :name, :screen_name, :screen_name_natural, :sector_activity_id, :name_natural, :document_1, :document_1_natural, :document_2, :email, :phone_number, :description,
          { addresses_attributes: }
        ]

        params.require(:account).permit(
          :default_currency,
          :country_code,
          :invoice_number_starts_at,
          :invoice_due_days,
          :invoice_tax_percentage,
          :invoice_tax_already_applied,
          :directory_visible,
          :profession_category,
          :directory_description,
          :instagram_url,
          :pix_key,
          { specialties: [], company_attributes: }
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
          profile_views: account.profile_views,
          directory_visible: account.directory_visible,
          profession_category: account.profession_category,
          directory_description: account.directory_description,
          instagram_url: account.instagram_url,
          specialties: account.specialties || [],
          pix_key: account.pix_key,
          company: company_data(account.company)
        }
      end

      def company_data(company)
        return nil unless company

        {
          id: company.id,
          name: company.name,
          screen_name: company.screen_name,
          screen_name_natural: company.screen_name,
          name_natural: company.name_natural,
          document_1: company.document_1,
          document_1_natural: company.document_1_natural,
          document_2: company.document_2,
          email: company.email,
          phone_number: company.phone_number,
          description: company.description,
          logo_url: logo_url_for(company),
          cover_url: cover_url_for(company),
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

      # Bypass model-level validations (e.g. validates_associated :nfse_config) that
      # cause company.logo.attach to silently fail because attach internally calls save.
      def attach_image_directly(record, attachment_name, upload_param)
        blob = ActiveStorage::Blob.create_and_upload!(
          io: upload_param.tempfile,
          filename: upload_param.original_filename,
          content_type: upload_param.content_type
        )
        # Remove previous attachment without touching the model
        ActiveStorage::Attachment
          .where(record_type: record.class.base_class.name, record_id: record.id, name: attachment_name.to_s)
          .each(&:purge)
        ActiveStorage::Attachment.create!(
          name: attachment_name.to_s,
          record_type: record.class.base_class.name,
          record_id: record.id,
          blob: blob,
          account: @account
        )
      end

      def logo_url_for(company)
        return nil unless company&.logo&.attached?
        rails_blob_url(company.logo)
      rescue StandardError => e
        Rails.logger.error "[AccountSettings] logo_url_for failed for company #{company&.id}: #{e.message}"
        nil
      end

      def cover_url_for(company)
        return nil unless company&.cover_image&.attached?
        rails_blob_url(company.cover_image)
      rescue StandardError => e
        Rails.logger.error "[AccountSettings] cover_url_for failed for company #{company&.id}: #{e.message}"
        nil
      end
    end
  end
end

