# frozen_string_literal: true

require 'test_helper'

module Transactions
  class SearchTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @bank_account = @account.default_bank_account
      @contact = create_contact(@account, name: 'John Doe')
      @category = create_category @account
      @cost_center = create_cost_center @account
      @transaction  = create_transaction @account, @bank_account, contact: @contact, category: @category
      @transaction1 = create_transaction @account, @bank_account, category: @category
      @transaction2 = create_transaction @account, @bank_account, contact: @contact
      @transaction3 = create_transaction @account, @bank_account

    end

    test 'should search a transaction by name' do
      @transaction = create_transaction @account, @bank_account, contact: @contact, category: @category
      query = Transactions::Search.call(
        account: @account,
        bank_account: @bank_account,
        period: Date.current.all_month,
        transaction_type: [:revenue],
        q: @transaction.name,
        date_filter: nil,
        payment_status_filter: nil
      ).query

      transactions = query.load

      assert transactions.count.positive?
      assert_equal @transaction.name, transactions.first.name
    end

    test 'should search a transaction by contact name' do
      query = Transactions::Search.call(
        account: @account,
        bank_account: @bank_account,
        period: Date.current.all_month,
        transaction_type: [:revenue],
        q: @contact.name,
        date_filter: nil,
        payment_status_filter: nil
      ).query
      transactions = query.load
      assert transactions.count.positive?
      assert_equal 2, transactions.count
      assert_equal [@transaction.id, @transaction2.id], transactions.order(:id).pluck(:id)
      assert_equal @transaction.name, transactions.first.name
      assert_equal @contact.name, transactions.first.contact.name
    end

    test 'should search a transaction by category name' do
      query = Transactions::Search.call(
        account: @account,
        bank_account: @bank_account,
        period: Date.current.all_month,
        transaction_type: [:revenue],
        q: @category.name,
        date_filter: nil,
        payment_status_filter: nil
      ).query

      transactions = query.load

      assert transactions.count.positive?
      assert_equal 2, transactions.count
      assert_equal [@transaction.id, @transaction1.id].sort, transactions.order(:id).pluck(:id).sort
      assert_equal [@transaction.name, @transaction1.name].sort, transactions.map(&:name).sort
      assert_equal @category.name, transactions.first.category.name
    end

    test 'should not search a transaction by not existent name' do
      query = Transactions::Search.call(
        account: @account,
        bank_account: @bank_account,
        period: Date.current.all_month,
        transaction_type: [:revenue],
        q: SecureRandom.hex,
        date_filter: nil,
        payment_status_filter: nil
      ).query

      transactions = query.load

      assert transactions.count.zero?
    end
  end
end

