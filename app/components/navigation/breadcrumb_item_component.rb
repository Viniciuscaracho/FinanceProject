# frozen_string_literal: true

class Navigation::BreadcrumbItemComponent < ApplicationComponent
  def initialize(text:, options: {})
    @text = text
    @options = options
    super
  end
end
