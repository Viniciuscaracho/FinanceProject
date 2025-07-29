# frozen_string_literal: true

module Panels
  class CardComponent < ApplicationComponent
    renders_one  :header, Panels::CardHeaderComponent
    renders_many :bodies, Panels::CardBodyComponent
    renders_one  :footer, Panels::CardFooterComponent

    def initialize(options: {})
      @options = options
      super
    end
  end
end
