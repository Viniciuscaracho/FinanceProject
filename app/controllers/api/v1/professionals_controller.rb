# frozen_string_literal: true

module Api
  module V1
    class ProfessionalsController < ApplicationController
      before_action :set_professional, only: [:show, :update, :destroy, :update_schedule,
                                              :commission_configs, :create_commission_config,
                                              :update_commission_config, :destroy_commission_config]

      # GET /api/v1/professionals
      def index
        professionals = current_account.account_users
                                      .includes(:user)
                                      .order('users.first_name')

        render json: professionals.map { |au| professional_json(au) }
      end

      # GET /api/v1/professionals/:id
      def show
        render json: professional_json(@professional)
      end

      # POST /api/v1/professionals
      def create
        user = User.find_by(email: professional_params[:email])

        unless user
          first_name = professional_params[:first_name]&.strip
          last_name = professional_params[:last_name]&.strip

          if first_name.blank? && professional_params[:name].present?
            name_parts = professional_params[:name].strip.split(' ', 2)
            first_name = name_parts[0] if first_name.blank?
            last_name = name_parts[1] if last_name.blank? && name_parts.length > 1
          end

          if first_name.blank?
            render json: { errors: ['Nome é obrigatório'] }, status: :unprocessable_entity
            return
          end

          last_name = last_name.presence || ''

          user = User.new(
            email: professional_params[:email]&.strip,
            first_name: first_name,
            last_name: last_name,
            phone_number: professional_params[:phone_number]&.strip,
            password: professional_params[:password].presence || Devise.friendly_token[0, 20],
            password_confirmation: professional_params[:password].presence || Devise.friendly_token[0, 20],
            accepted_terms_at: Time.current,
            accepted_privacy_at: Time.current
          )

          unless user.save
            render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
            return
          end
        end

        existing_account_user = current_account.account_users.find_by(user: user)
        if existing_account_user
          render json: { errors: ['Este profissional já está cadastrado nesta conta'] }, status: :unprocessable_entity
          return
        end

        schedule_data = nil
        if professional_params[:schedule].present?
          schedule_data = {}
          professional_params[:schedule].each do |key, value|
            day_key = key.to_sym
            schedule_data[day_key] = {
              enabled: value[:enabled] || value['enabled'] || false,
              start_hour: (value[:start_hour] || value['start_hour'] || 9).to_i,
              end_hour: (value[:end_hour] || value['end_hour'] || 18).to_i
            }
          end
        end

        commission_pct = professional_params[:commission_percentage].present? ? professional_params[:commission_percentage].to_f : 50.0

        account_user = current_account.account_users.build(
          user: user,
          role: professional_params[:role] || :custom,
          schedule: schedule_data,
          commission_percentage: commission_pct
        )

        if account_user.save
          render json: professional_json(account_user), status: :created
        else
          render json: { errors: account_user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/professionals/:id
      def update
        user = @professional.user

        user_params = {}
        user_params[:first_name] = professional_params[:first_name] if professional_params[:first_name].present?
        user_params[:last_name] = professional_params[:last_name] if professional_params[:last_name].present?
        user_params[:email] = professional_params[:email] if professional_params[:email].present?
        user_params[:phone_number] = professional_params[:phone_number] if professional_params[:phone_number].present?
        user_params[:password] = professional_params[:password] if professional_params[:password].present?
        user_params[:password_confirmation] = professional_params[:password] if professional_params[:password].present?

        user.update!(user_params) if user_params.any?

        account_user_params = {}
        account_user_params[:role] = professional_params[:role] if professional_params[:role].present?
        account_user_params[:schedule] = professional_params[:schedule] if professional_params[:schedule].present?
        account_user_params[:commission_percentage] = professional_params[:commission_percentage].to_f if professional_params[:commission_percentage].present?

        @professional.update!(account_user_params) if account_user_params.any?

        render json: professional_json(@professional)
      end

      # PATCH /api/v1/professionals/:id/update_schedule
      def update_schedule
        schedule_data = params[:schedule] || {}

        if schedule_data.present?
          normalized_schedule = {}
          schedule_data.each do |key, value|
            day_key = key.to_sym
            normalized_schedule[day_key] = {
              enabled: value[:enabled] || value['enabled'] || false,
              start_hour: (value[:start_hour] || value['start_hour'] || 9).to_i,
              end_hour: (value[:end_hour] || value['end_hour'] || 18).to_i
            }
          end

          @professional.update!(schedule: normalized_schedule)
          render json: {
            success: true,
            schedule: @professional.schedule,
            message: 'Horários atualizados com sucesso'
          }
        else
          render json: { error: 'Dados de horário não fornecidos' }, status: :unprocessable_entity
        end
      rescue => e
        Rails.logger.error "Error updating schedule: #{e.message}"
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # GET /api/v1/professionals/:id/commission_configs
      def commission_configs
        configs = @professional.professional_commissions.includes(:service)
        render json: configs.map { |c| commission_config_json(c) }
      end

      # POST /api/v1/professionals/:id/commission_configs
      def create_commission_config
        config = @professional.professional_commissions.build(commission_config_params)
        if config.save
          render json: commission_config_json(config), status: :created
        else
          render json: { errors: config.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/professionals/:id/commission_configs/:commission_config_id
      def update_commission_config
        config = @professional.professional_commissions.find(params[:commission_config_id])
        if config.update(commission_config_params)
          render json: commission_config_json(config)
        else
          render json: { errors: config.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Configuração não encontrada' }, status: :not_found
      end

      # DELETE /api/v1/professionals/:id/commission_configs/:commission_config_id
      def destroy_commission_config
        config = @professional.professional_commissions.find(params[:commission_config_id])
        config.destroy
        head :no_content
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Configuração não encontrada' }, status: :not_found
      end

      # DELETE /api/v1/professionals/:id
      def destroy
        @professional.destroy
        head :no_content
      end

      private

      def current_account
        Current.account
      end

      def set_professional
        @professional = current_account.account_users.find(params[:id])
      end

      def professional_params
        params.require(:professional).permit(
          :first_name, :last_name, :name, :email, :password,
          :role, :phone_number, :commission_percentage, schedule: {}
        )
      end

      def commission_config_params
        params.require(:commission_config).permit(:service_id, :commission_type, :commission_value)
      end

      def professional_json(account_user)
        {
          id: account_user.id,
          user_id: account_user.user_id,
          name: account_user.user.name,
          first_name: account_user.user.first_name,
          last_name: account_user.user.last_name,
          email: account_user.user.email,
          phone_number: account_user.user.phone_number,
          role: account_user.role,
          commission_percentage: account_user.commission_percentage.to_f,
          schedule: account_user.schedule || {},
          created_at: account_user.created_at.iso8601,
          updated_at: account_user.updated_at.iso8601
        }
      end

      def commission_config_json(config)
        {
          id: config.id,
          account_user_id: config.account_user_id,
          service_id: config.service_id,
          service_name: config.service&.name,
          commission_type: config.commission_type,
          commission_value: config.commission_value.to_f,
          created_at: config.created_at.iso8601,
          updated_at: config.updated_at.iso8601
        }
      end
    end
  end
end
