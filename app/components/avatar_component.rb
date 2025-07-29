# frozen_string_literal: true

class AvatarComponent < ApplicationComponent
  def initialize(avatable:, icon: :user, options: {})
    @avatable = avatable
    @icon = icon
    @options = options
    super
  end

  def processed_image_url
    @avatable.avatar.representation(resize_to_limit: [100, 100]).processed.url
  rescue ActiveStorage::Error => e
    Rails.logger.error e.message
    @avatable.avatar.url
  rescue StandardError => e
    Rails.logger.error e.message
    if @avatable.is_a?(Company)
      'company_logo_placeholder.png'
    else
      'avatar_placeholder.png'
    end
  end
end
