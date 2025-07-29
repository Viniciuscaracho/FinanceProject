# frozen_string_literal: true

module Elements
  class DropdownGroupComponent < ApplicationComponent
    renders_many :items, types: {
      header: DropdownHeaderComponent,
      menu: DropdownItemComponent
    }

    def initialize(options: {})
      @options = options
      super
    end
  end
end
