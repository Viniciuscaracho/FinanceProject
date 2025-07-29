# frozen_string_literal: true

module Transactions
  class AmountViewerComponent < ApplicationComponent
    def initialize(transaction:)
      @transaction = transaction
      super
    end
  end
end
