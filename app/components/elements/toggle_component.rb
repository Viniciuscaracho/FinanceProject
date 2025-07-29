# frozen_string_literal: true

module Elements
  class ToggleComponent < ApplicationComponent
    def initialize(form:, attribute:, options: {})
      @form = form
      @attribute = attribute
      @options = options
      super
    end
  end
end
