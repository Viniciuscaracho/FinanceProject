# frozen_string_literal: true

class Tabs::NavItemComponent < ApplicationComponent
  def initialize(name:, url:, active:, options: {})
    @name = name
    @url = url
    @active = active
    @options = options || {}
    super
  end
end
