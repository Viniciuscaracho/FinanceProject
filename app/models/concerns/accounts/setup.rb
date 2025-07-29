# frozen_string_literal: true

module Accounts
  module Setup
    extend ActiveSupport::Concern

    included do
      before_validation :set_default_attributes, on: :create
      before_validation :set_company_default_attributes, on: :create

      after_create :set_account_to_company, :set_default_account_to_owner
      after_create :create_default_bank_accounts
      after_create :create_personal_account_to_owner, if: :business?
    end

    protected

    def set_default_attributes
      if business?
        self.max_active_users = 3
        self.max_storage_size_in_bytes = 50.gigabytes
      else
        self.max_active_users = 1
        self.max_storage_size_in_bytes = 15.gigabytes
      end
    end

    # Creates two default bank accounts
    # 1 - Wallet (if personal)/Cash (if business)
    # 2 - Main account
    def create_default_bank_accounts
      bank_accounts.create!(name: I18n.t('bank_accounts.default_name'), account_type: :current_account, default: true)
      if business?
        bank_accounts.create!(name: I18n.t('bank_accounts.default_cash_name'), account_type: :cash_account, default: false)
      else
        bank_accounts.create!(name: I18n.t('bank_accounts.default_wallet_name'), account_type: :wallet, default: false)
      end
    end

    def set_company_default_attributes
      company.email = owner.email
      if business?
        company.person_type_cd = Person::PERSON_TYPES[:legal]
      else
        company.name = owner.name if owner.first_name.present?
        company.person_type_cd = Person::PERSON_TYPES[:natural]
      end
    end

    def set_default_account_to_owner
      return if owner.account.present?

      owner.account = self
      owner.save!
    end

    def set_account_to_company
      return if company.account.present?

      company.update!(account: self)
    end

    def create_personal_account_to_owner
      return if owner.my_accounts.personal.exists?
      return if referral_code.present? && !referral_code.create_free_personal_account

      account = owner.my_accounts.new(account_type: :personal, subscription_status: :active, free: true)
      account.build_company(name:, email:, person_type: :natural)
      account.account_users.build(user: owner, role: :admin)

      account.save!
      account
    end
  end
end
