# frozen_string_literal: true

module Buttons
  class BaseComponent < ApplicationComponent
    def initialize(url:, options: {})
      @url = url
      @options = options || {}
      super
    end
  end
end
