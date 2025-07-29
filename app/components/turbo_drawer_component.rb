# frozen_string_literal: true

class TurboDrawerComponent < ApplicationComponent
  def initialize(title:, subtitle: nil, close_on_submit: true, options: {})
    super
    @title = title
    @subtitle = subtitle
    @close_on_submit = close_on_submit
    @options = options
  end
end
