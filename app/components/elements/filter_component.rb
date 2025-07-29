# frozen_string_literal: true
module Elements
  class FilterComponent < ApplicationComponent
    renders_one :button, Elements::Filter::ButtonComponent
    renders_one :dropdown, Elements::Filter::DropdownComponent

    def initialize(options: {})
      @options = options
      super
    end

  end
end
