# frozen_string_literal: true

module Charts
  class ColumnComponent < ApplicationComponent
    def initialize(data:, options: {})
      @data = data
      @options = options
      super
    end
  end
end
