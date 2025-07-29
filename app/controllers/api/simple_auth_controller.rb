# frozen_string_literal: true

module Api
  class SimpleAuthController < ActionController::API
    include ActionController::HttpAuthentication::Token::ControllerMethods
    include Pagy::Backend
    
    before_action :authenticate_user!
    
    rescue_from Pagy::OverflowError, Pagy::VariableError, with: :invalid_page
    rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
    rescue_from ActiveRecord::NotNullViolation, with: :record_null_violation
    rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

    renderer.defaults.merge!({ http_host: ENV.fetch('DEFAULT_HOST_NAME', 'localhost:3000'), https: Rails.env.production? })

    private

    def authenticate_user!
      user = authenticate_with_http_token do |token, options|
        User.find_by(api_token: token)
      end

      if user
        Current.user = user
        Current.account = user.account
      else
        render json: { error: 'Token inválido ou expirado' }, status: :unauthorized
      end
    end

    def invalid_page(exception)
      render json: { error: 'Página inválida', description: exception.message }, status: :bad_request
    end

    def record_null_violation(exception)
      render json: { error: 'Violação de campo obrigatório', description: exception.cause }, status: :unprocessable_entity
    end

    def record_invalid(exception)
      render json: { error: 'Dados inválidos', description: exception.message }, status: :unprocessable_entity
    end

    def record_not_found(exception)
      render json: { error: 'Registro não encontrado', description: "#{exception.model} com ID #{exception.id} não foi encontrado" }, status: :not_found
    end
  end
end 