# frozen_string_literal: true

module Elements
  class TagListComponent < ApplicationComponent
    def initialize(taggable:)
      @taggable = taggable
      super
    end
  end
end
