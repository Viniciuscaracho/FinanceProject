# frozen_string_literal: true

module Accounts
  module Preferences
    extend ActiveSupport::Concern

    included do
      # Invoices
      # store_accessor :preferences, :invoice_number_starts_at
      # store_accessor :preferences, :invoice_due_days, :integer
      # store_accessor :preferences, :invoice_tax_already_applied
      # store_accessor :preferences, :invoice_tax_percentage
      store_attribute :preferences, :invoice_number_starts_at, :integer, default: 1
      store_attribute :preferences, :invoice_due_days, :integer, default: 10
      store_attribute :preferences, :invoice_tax_already_applied, :boolean, default: true
      store_attribute :preferences, :invoice_tax_percentage, :decimal, default: 0
    end
    #
    # def invoice_number_starts_at=(value)
    #   super value.to_i
    # end
    #
    # def invoice_number_starts_at
    #   (super.presence || 1).to_i || 1
    # end
    #
    # def invoice_due_days=(value)
    #   super value.to_i
    # end
    #
    # def invoice_due_days
    #   (super.presence || 10).to_i
    # end
    #
    # def invoice_tax_already_applied=(value)
    #   super value.to_boolean
    # end
    #
    # def invoice_tax_already_applied
    #   (super.presence || true).to_boolean
    # end
    #
    # def invoice_tax_percentage=(value)
    #   super value.to_i
    # end
    #
    # def invoice_tax_percentage
    #   (super.presence || 0).to_i
    # end
  end
end
