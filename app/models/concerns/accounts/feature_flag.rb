# frozen_string_literal: true

module Accounts
  # FeatureFlag module
  # This module is responsible for enabling or disabling features for an account
  module FeatureFlag
    extend ActiveSupport::Concern

    FEATURE_NAMES = %i[api nfse open_banking].freeze

    def feature_enabled?(feature)
      return false if FEATURE_NAMES.exclude?(feature.to_sym)

      ensure_feature_exists?(feature)
      # Flipper.enabled?(feature, self)
    end

    def flipper_id
      prefix_id
    rescue StandardError
      SecureRandom.uuid
    end

    def api_enabled?
      feature_enabled?(:api)
    end

    def nfse_enabled?
      business? && feature_enabled?(:nfse)
    end

    def open_banking_enabled?
      feature_enabled?(:open_banking)
    end

    def ensure_feature_exists?(feature)
      # Temporariamente desabilitar Flipper para evitar erros
      return true
      
      # Código original comentado:
      # return if defined?(Flipper) && Flipper.exist?(feature)
      # 
      # ApplicationRecord.connected_to(role: :writing) do
      #   Flipper.add(feature) if defined?(Flipper)
      # end
    end
  end
end
