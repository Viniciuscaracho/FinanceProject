# frozen_string_literal: true

module Buttons
  class AddComponent < ApplicationComponent
    def initialize(url: nil, options: {})
      @url = url
      @options = options
      super
    end
  end
end
