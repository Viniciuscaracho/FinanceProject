# frozen_string_literal: true

module Elements
  module Filter
    class DropdownComponent < ApplicationComponent
      renders_many :options, Elements::Filter::OptionComponent

      def initialize(clear_link: nil, options: {})
        @options = options
        @clear_link = clear_link
        super
      end
    end
  end
end
