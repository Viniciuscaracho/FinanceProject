# frozen_string_literal: true

module Buttons
  class CancelComponent < ApplicationComponent
    def initialize(url:, value: t('shared.cancel'), options: {})
      @url = url
      @value = value
      @options = options || {}
      super
    end
  end
end
