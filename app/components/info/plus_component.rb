# frozen_string_literal: true

module Info
  class PlusComponent < ApplicationComponent
    def initialize(url: nil, options: {})
      super
      @url = url
      @options = options
    end
  end

end
