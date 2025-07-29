# frozen_string_literal: true

module Page
  class HeaderComponent < ApplicationComponent
    renders_one  :search
    renders_many :actions
    renders_one :body

    def initialize(title:, subtitle: nil, options: {})
      @title = title
      @subtitle = subtitle
      @options = options
      super
    end
  end
end
