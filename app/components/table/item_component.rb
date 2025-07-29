# frozen_string_literal: true

module Table
  class ItemComponent < ApplicationComponent
    renders_many :cols, 'Table::ColumnComponent'

    def initialize(options: {})
      super
      @options = options
    end
  end
end
