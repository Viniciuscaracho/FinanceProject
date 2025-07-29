# frozen_string_literal: true
module Api
  class InvalidToken < StandardError
    def initialize(msg = I18n.t('errors.invalid_token.message'))
      super
    end

    def name
      I18n.t('errors.invalid_token.title')
    end

    def http_status
      :forbidden
    end
  end
end
