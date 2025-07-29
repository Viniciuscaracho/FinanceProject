# frozen_string_literal: true

require 'test_helper'

module Transactions
  class BulkDestroyTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @bank_account = create_bank_account(@account)
      @category = create_category(@account)
      @contact = create_contact(@account)
      @cost_center = create_cost_center(@account)

      @transaction  = create_transaction @account, @bank_account, contact: @contact, category: @category
      @transaction1 = create_transaction @account, @bank_account, category: @category
      @transaction2 = create_transaction @account, @bank_account, contact: @contact
      @transaction3 = create_transaction @account, @bank_account

      @detail_transaction = create_transaction_and_children(@account, @bank_account, contact: @contact, category: @category)

    end

    test 'should destroy transactions only parents' do
      transactions = @account.transactions.only_parents
      transactions_ids = transactions.ids

      # remove 3 transactions
      result = Transactions::BulkDestroy.call(account: @account, transactions_ids: transactions_ids[0..2])

      assert result.success?
      assert_equal 2, transactions.count
    end

    test 'should destroy transactions parents with children' do
      transactions = @account.transactions.only_parents
      transactions_ids = transactions.ids

      result = Transactions::BulkDestroy.call(account: @account, transactions_ids:)

      assert result.success?
      assert_equal 0, @account.transactions.count
    end
  end
end

