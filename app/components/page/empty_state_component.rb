# frozen_string_literal: true

class Page::EmptyStateComponent < ApplicationComponent
  renders_many :actions, Page::EmptyStateActionComponent

  def initialize(title:, message:, options: {})
    @title = title
    @message = message
    @options = options
    super
  end
end
