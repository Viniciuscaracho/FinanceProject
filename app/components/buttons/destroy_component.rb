# frozen_string_literal: true

module Buttons
  class DestroyComponent < ApplicationComponent
    def initialize(model: nil,
                   url: nil,
                   message: I18n.t('shared.are_you_sure?'),
                   title: I18n.t('shared.destroy'),
                   options: {})
      @model = model
      @url = url
      @message = message
      @title = title
      @options = options || {}
      super
    end
  end
end
