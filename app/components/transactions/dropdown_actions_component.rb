# frozen_string_literal: true

module Transactions
  class DropdownActionsComponent < ApplicationComponent
    def initialize(transaction:, current_required_params: {})
      @transaction = transaction
      @current_required_params = current_required_params
      super
    end
  end
end
