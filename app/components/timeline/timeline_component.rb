module Timeline
  class TimelineComponent < ApplicationComponent
    renders_one :body

    def initialize(options: {})
      super
      @options = options
    end
  end
end