module BankAccounts
  module Validations
    extend ActiveSupport::Concern

    included do
      before_validation on: :update do
        without_auditing { other_bank_accounts.update!(default: false) if default_changed? && default? }
      end

      validates :name, presence: true
      validates :balance_cents, presence: true, numericality: { greater_than_or_equal_to: -9_223_372_036_854_775_800, less_than: 9_223_372_036_854_775_800 }
    end

  end
end