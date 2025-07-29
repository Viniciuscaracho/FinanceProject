# frozen_string_literal: true
module Api
  class ExpiredToken < StandardError
    def initialize(msg = I18n.t('errors.expired_token.message'))
      super
    end

    def name
      I18n.t('errors.expired_token.title')
    end

    def http_status
      :unauthorized
    end
  end
end
