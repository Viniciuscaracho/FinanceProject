# frozen_string_literal: true

module Api
  class BaseController < ActionController::API
    include Pagy::Backend
    prepend_before_action :authenticate_api_token!
    before_action :ensure_api_enabled

    rescue_from Pagy::OverflowError, Pagy::VariableError, with: :invalid_page
    rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
    rescue_from ActiveRecord::NotNullViolation, with: :record_null_violation
    rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
    rescue_from Api::BlankToken, Api::ExpiredToken, Api::InvalidToken, Api::InvalidEnum, Api::PermissionDenied,
                with: :default_exception_handler

    renderer.defaults.merge!({ http_host: ENV.fetch('DEFAULT_HOST_NAME', 'localhost:3000'), https: Rails.env.production? })

    private

    def authenticate_api_token!
      if (user = user_from_token)
        sign_in user, store: false
        Current.user = user
        Current.account = api_token.account
      else
        head :internal_server_error
      end
    end

    def ensure_api_enabled
      raise Api::PermissionDenied unless Current.account.api_enabled?
    end

    def token_from_header
      request.headers.fetch('Authorization', '').split(' ').last
    end

    def api_token
      token = token_from_header

      raise Api::BlankToken if token.nil?

      @_api_token ||= ApiToken.find_by(token:)

      raise Api::InvalidToken if @_api_token.nil?
      raise Api::ExpiredToken if @_api_token&.expired?

      @_api_token
    end

    def user_from_token
      if api_token.present?
        ActiveRecord::Base.connected_to(role: ActiveRecord.writing_role) do
          api_token.touch(:last_used_at)
          api_token.user
        end
      end
    end

    def default_exception_handler(exception)
      render json: { error: exception.name, description: exception.message }, status: exception.http_status
    end

    def record_not_found(exception)
      render json: { error: I18n.t('.api.errors.record_not_found.title'),
                     description: I18n.t('.api.errors.record_not_found.description',
                                         model: exception.model, id: exception.id) },
             status: :not_found
    end

    def invalid_page(exception)
      render json: { error: I18n.t('.api.errors.invalid_page.title'), description: exception.message },
             status: :bad_request
    end

    def record_null_violation(exception)
      render json: { error: I18n.t('.api.errors.record_null_violation.title'), description: exception.cause },
             status: :unprocessable_entity
    end

    def record_invalid(exception)
      render json: { error: I18n.t('.api.errors.record_invalid.title'), description: exception.message },
             status: :unprocessable_entity
    end

    protected

    def authorize!(action, record)
      raise API::PermissionDenied unless Current.account
      raise Api::PermissionDenied unless api_token.can?(action, record)
    end
  end
end
