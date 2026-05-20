# frozen_string_literal: true

module Api
  module V1
    module Public
      class PublicController < ActionController::API
        def health_check
          render json: {
            status: "OK",
            timestamp: Time.current,
            environment: Rails.env
          }
        end

        def transactions_test
          render json: {
            message: "API pública funcionando!",
            timestamp: Time.current,
            status: "OK"
          }
        end

        def schema_debug
          cols = ActiveRecord::Base.connection.columns(:account_users).map(&:name)
          pending = ActiveRecord::Base.connection.select_values("SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 20")
          render json: { account_user_columns: cols, recent_migrations: pending }
        end
      end
    end
  end
end 