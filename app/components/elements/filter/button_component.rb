# frozen_string_literal: true

module Elements
  module Filter
    class ButtonComponent < ApplicationComponent

      def initialize(text: I18n.t('elements.filter.button.text'), icon: 'funnel', options: {})
        @text = text
        @icon = icon
        @options = options
        super
      end

    end
  end
end