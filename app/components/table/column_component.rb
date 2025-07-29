# frozen_string_literal: true

module Table
  class ColumnComponent < ApplicationComponent
    def initialize(title: nil, description: nil, options: {})
      @title = title
      @description = description
      @options = options
      super
    end
  end
end
