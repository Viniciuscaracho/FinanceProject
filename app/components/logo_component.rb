# frozen_string_literal: true

class LogoComponent < ApplicationComponent
  def initialize(avatable:, icon: :user, options: {})
    @avatable = avatable
    @icon = icon
    @options = options
    super
  end

  def processed_image_url
    @avatable.logo.representation(resize_to_limit: [100, 100]).processed.url
  rescue MiniMagick::Error
    @avatable.logo.url
  end
end
