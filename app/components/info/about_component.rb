# frozen_string_literal: true

module Info
  class AboutComponent < ApplicationComponent
    def initialize(title: nil, description: nil, title2: nil, description2: nil, options: {})
      super
      @title = title
      @description = description
      @title2 = title2
      @description2 = description2
      @options = options
    end
  end

end