module Timeline
  class TimelineItemComponent < ApplicationComponent
    renders_one :avatar
    renders_one :body
    def initialize(options: {}, date: nil)
      super
      @options = options
      @date = date
    end
  end
end