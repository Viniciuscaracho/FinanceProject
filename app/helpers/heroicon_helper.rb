# frozen_string_literal: true

module HeroiconHelper
  include Heroicon::Engine.helpers

  def icon(name, variant: Heroicon.configuration.variant, options: { class: 'sm:h-4 xl:h-5 sm:h-4 xl:w-5' })
    heroicon name, variant:, options:
  end
end
