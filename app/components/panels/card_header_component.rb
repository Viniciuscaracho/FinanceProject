# frozen_string_literal: true

module Panels
  class CardHeaderComponent < ApplicationComponent
    def initialize(title: nil, options: {})
      @title = title
      @options = options
      super
    end
  end
end
