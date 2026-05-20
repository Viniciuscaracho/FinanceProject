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
          conn = ActiveRecord::Base.connection
          au_cols = conn.columns(:account_users).map(&:name)
          acc_cols = conn.columns(:accounts).map(&:name)
          applied = conn.select_values("SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 20")
          all_applied = conn.select_values("SELECT version FROM schema_migrations ORDER BY version").map(&:to_s)
          local_versions = Dir[Rails.root.join("db/migrate/*.rb")].map { |f| File.basename(f).split("_").first }
          pending = (local_versions - all_applied).sort
          render json: {
            account_user_columns: au_cols,
            account_columns_google: acc_cols.select { |c| c.include?("google") || c.include?("calendar") },
            recent_applied_migrations: applied,
            pending_migrations: pending
          }
        end
      end
    end
  end
end 