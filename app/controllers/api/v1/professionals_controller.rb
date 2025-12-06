# frozen_string_literal: true

module Api
  module V1
    class ProfessionalsController < ApplicationController
      before_action :set_professional, only: [:show, :update, :destroy, :update_schedule]

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
        # Verificar se o usuário já existe
        user = User.find_by(email: professional_params[:email])
        
        unless user
          # Extrair first_name e last_name
          first_name = professional_params[:first_name]&.strip
          last_name = professional_params[:last_name]&.strip
          
          # Se não fornecido, tentar extrair do campo 'name'
          if first_name.blank? && professional_params[:name].present?
            name_parts = professional_params[:name].strip.split(' ', 2)
            first_name = name_parts[0] if first_name.blank?
            last_name = name_parts[1] if last_name.blank? && name_parts.length > 1
          end
          
          # Validar que first_name foi fornecido
          if first_name.blank?
            render json: { errors: ['Nome é obrigatório'] }, status: :unprocessable_entity
            return
          end
          
          # Se last_name estiver vazio, usar string vazia (não obrigatório)
          last_name = last_name.presence || ''
          
          # Criar novo usuário
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

        # Verificar se o usuário já está associado à conta
        existing_account_user = current_account.account_users.find_by(user: user)
        if existing_account_user
          render json: { errors: ['Este profissional já está cadastrado nesta conta'] }, status: :unprocessable_entity
          return
        end

        # Normalizar schedule se fornecido
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

        # Criar account_user (profissional)
        account_user = current_account.account_users.build(
          user: user,
          role: professional_params[:role] || :custom,
          schedule: schedule_data
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

        @professional.update!(account_user_params) if account_user_params.any?

        render json: professional_json(@professional)
      end

      # PATCH /api/v1/professionals/:id/schedule
      def update_schedule
        schedule_data = params[:schedule] || {}
        
        if schedule_data.present?
          # Converter chaves de string para símbolo se necessário
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
        Rails.logger.error e.backtrace.join("\n")
        render json: { error: e.message }, status: :unprocessable_entity
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
          :role, :phone_number, schedule: {}
        )
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
          schedule: account_user.schedule || {},
          created_at: account_user.created_at.iso8601,
          updated_at: account_user.updated_at.iso8601
        }
      end
    end
  end
end

