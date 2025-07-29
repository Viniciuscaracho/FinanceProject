# frozen_string_literal: true

module Table
  class BodyComponent < ApplicationComponent
    renders_many :items, 'Table::ItemComponent'

    def initialize(id: 'items', classes: '')
      super
      @id = id
      @classes = classes
    end
  end
end
