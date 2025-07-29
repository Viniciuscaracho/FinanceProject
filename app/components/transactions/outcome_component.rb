# frozen_string_literal: true

module Transactions
  class OutcomeComponent < ApplicationComponent
    def initialize(amount:, show_value:, about: nil)
      @amount = amount
      @show_value = show_value
      @about = about
      super
    end
  end
end
