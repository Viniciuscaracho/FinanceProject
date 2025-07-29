# frozen_string_literal: true

module Page
  class SearchFormComponent < ApplicationComponent
    def initialize(url:, value:, options: {})
      @url = url
      @value = value
      @options = options
      super
    end
  end
end
