# frozen_string_literal: true

module Elements
  module Filter
    class CheckboxComponent < ApplicationComponent

      def initialize(form:, label:, params_name:, checked: false, options: {}, selected: nil, multiple: false, include_none: false, order: :name)
        super
        @form = form
        @options = options
        @label = label
        @selected = selected
        @multiple = multiple
        @params_name = params_name
        @include_none = include_none
        @order = order
        @checked = checked
      end
    end
  end
end
