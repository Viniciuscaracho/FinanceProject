# frozen_string_literal: true
module Api
  class InvalidEnum < StandardError
    def initialize(msg = I18n.t('errors.invalid_enum.message'))
      super
    end

    def name
      I18n.t('errors.invalid_enum.title')
    end

    def http_status
      :unprocessable_entity
    end
  end
end
