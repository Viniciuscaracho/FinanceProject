# frozen_string_literal: true

module Buttons
  class SubmitComponent < ApplicationComponent
    def initialize(form:, value: nil, options: {})
      @form = form
      @value = value
      @options = options || {}
      super
    end
  end
end
