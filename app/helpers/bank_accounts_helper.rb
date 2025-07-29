# frozen_string_literal: true

module BankAccountsHelper
  def bank_accounts(sort_col: :name, sort_dir: :asc)
    Current.account.bank_accounts.order(default: :desc, sort_col => sort_dir).kept
  end
end
