# frozen_string_literal: true

require 'test_helper'

module Transactions
  class BulkUpdateTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @bank_account = create_bank_account(@account)
      @category = create_category(@account)
      @contact = create_contact(@account)
      @cost_center = create_cost_center(@account)

      @transaction = create_transaction @account, @bank_account, contact: @contact, category: @category
      @transaction1 = create_transaction @account, @bank_account, category: @category
      @transaction2 = create_transaction @account, @bank_account, contact: @contact
      @transaction3 = create_transaction @account, @bank_account

      @detail_transaction, @children = create_transaction_and_children(@account, @bank_account, contact: @contact, category: @category)

    end

    test 'should update transactions' do
      transactions = @account.transactions

      result = Transactions::BulkUpdate.call(account: @account, transactions:, params: { category_id: @category.id })

      assert result.success?
      assert_equal 8, transactions.count
      @account.transactions.each do |transaction|
        assert_equal @category.id, transaction.category_id
      end
    end

    test 'should update transactions with children' do
      transactions = @account.transactions

      result = Transactions::BulkUpdate.call(account: @account, transactions:, params: { category_id: @category.id })

      assert result.success?
      assert_equal 8, transactions.count
      @account.transactions.each do |transaction|
        assert_equal @category.id, transaction.category_id
      end
    end

    test 'should update transactions with children and update params' do
      transactions = @account.transactions

      result = Transactions::BulkUpdate.call(account: @account, transactions:, params: { category_id: @category.id })

      assert result.success?
      assert_equal 8, transactions.count
      @detail_transaction.children.each do |transaction|
        assert_equal @category.id, transaction.category_id
      end
    end

  end
end

