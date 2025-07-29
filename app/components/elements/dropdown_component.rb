# frozen_string_literal: true

module Elements
  class DropdownComponent < ApplicationComponent
    renders_many :groups, DropdownGroupComponent

    def initialize(options: {})
      @options = options
      super
    end
  end
end
