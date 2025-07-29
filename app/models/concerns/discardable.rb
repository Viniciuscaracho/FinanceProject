# frozen_string_literal: true

module Discardable
  extend ActiveSupport::Concern

  included do
    include Discard::Model

    default_scope -> { kept }
    scope :only_discarded, -> { with_discarded.discarded }
  end
end
