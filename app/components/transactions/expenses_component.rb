# frozen_string_literal: true

module Transactions
  class ExpensesComponent < ApplicationComponent
    def initialize(percentage:, paid_amount:, predicted_amount:, show_value:, bank_account_id: nil, month: nil, options: {})
      @percentage = percentage
      @paid_amount = paid_amount
      @predicted_amount = predicted_amount
      @show_value = show_value
      @bank_account_id = bank_account_id
      @month = month
      @options = options
      super
    end
  end
end
