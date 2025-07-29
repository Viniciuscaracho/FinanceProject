# frozen_string_literal: true

class Page::EmptyStateActionComponent < ApplicationComponent
  def initialize(value:, href:, options: {})
    @value = value
    @href = href
    @options = options
    super
  end

end
