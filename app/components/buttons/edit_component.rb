# frozen_string_literal: true

module Buttons
  class EditComponent < ApplicationComponent
    def initialize(url: nil, model: nil, title: t('shared.edit'), options: {})
      @url = url
      @model = model
      @title = title
      @options = options || {}
      super
    end
  end
end
