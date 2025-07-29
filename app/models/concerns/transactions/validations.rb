# frozen_string_literal: true

# This module is responsible for the constants of the Transaction model
module Transactions
  module Validations
    extend ActiveSupport::Concern

    included do
      before_validation :sanitize_name

      validates :account, :due_date, :bank_account, presence: true
      validates :amount_cents,
                :exchanged_amount_cents,
                presence: true,
                numericality: {
                  greater_than_or_equal_to: 0,
                  less_than_or_equal_to: 999_999_999_999
                }
      validates :amount_currency,
                :exchanged_amount_currency,
                presence: true,
                inclusion: { in: Money::Currency.all.map(&:iso_code) }
      validates :transfer_to, presence: { if: :transfer? }
      validate :validate_transfer_same_bank_account, if: :transfer?
      validate :validate_bank_account, if: :bank_account_id
      validate :validate_cost_center, if: :cost_center_id
      validate :validate_category, if: :category_id
      validate :validate_contact, if: :contact_id
      validate :validate_transfer_to, if: :transfer?
      validate :validate_transaction_type

    end

    def sanitize_name
      self.name = name.squish unless name.nil?
    end

    def validate_transfer_same_bank_account
      if transfer? && bank_account_id == transfer_to_id
        errors.add :base,
                   I18n.t('activerecord.errors.models.transaction.transfer_same_bank_account')
      end

    end

    def validate_transfer_to
      if transfer? && transfer_to_id.nil? || !account.bank_accounts.exists?(transfer_to_id)
        errors.add :base, I18n.t('activerecord.errors.models.transaction.transfer_to')
      end
    end

    def validate_bank_account
      if bank_account_id.nil? || !account.bank_accounts.exists?(bank_account_id)
        errors.add :base, I18n.t('activerecord.errors.models.transaction.bank_account')
      end
    end

    def validate_cost_center
      if cost_center_id.nil? || !account.cost_centers.exists?(cost_center_id)
        errors.add :base, I18n.t('activerecord.errors.models.transaction.cost_center')
      end
    end

    def validate_category
      if category_id.nil? || !account.categories.exists?(category_id)
        errors.add :base, I18n.t('activerecord.errors.models.transaction.category')
      end
    end

    def validate_contact
      if contact_id.nil? || !account.contacts.exists?(contact_id)
        errors.add :base, I18n.t('activerecord.errors.models.transaction.contact')
      end
    end

    def validate_transaction_type
      if transaction_type_cd.nil?
        errors.add :base, I18n.t('activerecord.errors.models.transaction.attributes.transaction_type.nil')
      end
    end
  end
end
