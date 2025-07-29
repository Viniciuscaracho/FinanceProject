# frozen_string_literal: true

# This module is responsible for the constants of the Transaction model
module Transactions
  module Constants
    extend ActiveSupport::Concern

    TRANSACTION_TYPES = {
      revenue: 0,
      fixed_expense: 1,
      variable_expense: 2,
      payroll: 3,
      tax: 4,
      transfer: 5
    }.freeze

    PAYMENT_TYPE = {
      on_cash: 0,
      installment: 1,
      recurring: 2
    }.freeze

    PAYMENT_METHOD = {
      no_payment_method: 0,
      credit_card: 1,
      debit_card: 2,
      bank_slip: 3,
      check: 4,
      cash: 5,
      pix: 6,
      bank_transfer: 7,
      direct_debit: 8,
      promissory: 9
    }.freeze

    KINDS = {
      simple: 0,
      detailed: 1,
      child: 2
    }.freeze

    FREQUENCIES = {
      daily: 0,
      weekly: 1,
      biweekly: 2,
      monthly: 3,   # padrão
      bimonthly: 4,
      quarterly: 5,
      semiannual: 6,
      annual: 7
    }.freeze

    ACCEPTED_CURRENCIES = %i[BRL USD EUR GBP CNY JPY AED CLP ARS].freeze

    # ACCEPTED_CURRENCIES = Money::Currency.all.map(&:iso_code).freeze

    INSTALLMENT_ACTIONS = %i[only_this_installment this_and_next_installments prev_and_next_installments
                             this_and_prev_installments].freeze
  end
end
