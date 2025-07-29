# frozen_string_literal: true

class Elements::ClipboardComponent < ApplicationComponent
  def initialize(value:)
    super
    @value = value
  end
end
