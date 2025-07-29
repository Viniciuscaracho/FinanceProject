# frozen_string_literal: true

module Info
  class InfoCardComponent < ApplicationComponent
    renders_one :body
    renders_one :footer

    def initialize(options: {}, icon: nil, title: nil, link: nil, &block)
      super
      @options = options
      @icon = icon
      @title = title
      @link = link

    end
  end
end
