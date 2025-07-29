# frozen_string_literal: true
module Api
  class BlankToken < StandardError
    def initialize(msg = I18n.t('errors.blank_token.message'))
      super
    end

    def name
      I18n.t('errors.blank_token.title')
    end

    def http_status
      :bad_request
    end
  end
end
