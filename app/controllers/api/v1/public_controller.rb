# frozen_string_literal: true

module Api
  module V1
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
    end
  end
end 