# frozen_string_literal: true

module Charts
  class PieComponent < ApplicationComponent
    def initialize(data:, options:)
      truncated_data = data.map do |point|
        truncated_name = point[0].length > 30 ? "#{point[0][0, 30]}..." : point[0]
        _truncated_point = [truncated_name, point[1]]
      end
      @data = truncated_data
      @options = options
      super
    end
  end
end
