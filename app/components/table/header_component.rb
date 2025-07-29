# frozen_string_literal: true

module Table
  class HeaderComponent < ApplicationComponent
    renders_many :cols, 'Table::ColumnComponent'

    def initialize(classes: '')
      super
      @classes = classes
    end
  end
end
