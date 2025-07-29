# frozen_string_literal: true

module Elements
  class DropdownItemComponent < ApplicationComponent
    def initialize(href: 'javascript:;', icon: nil, options: {})
      @icon = icon
      @href = href
      @options = options
      super
    end
  end
end
