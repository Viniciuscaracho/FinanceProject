# frozen_string_literal: true

class TurboLoadingComponent < ApplicationComponent
  def initialize(text: nil)
    @text = text
    super
  end
end
