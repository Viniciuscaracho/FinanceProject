# frozen_string_literal: true

require 'test_helper'

class BulkMoveToTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @bank_account = create_bank_account(@account)
    @category = create_category(@account)
    @contact = create_contact(@account)
    @cost_center = create_cost_center(@account)

    @transaction = create_transaction @account, @bank_account, contact: @contact, category: @category
    @transaction1 = create_transaction @account, @bank_account, category: create_category(@account)
    @transaction2 = create_transaction @account, @bank_account, contact: @contact
    @transaction3 = create_transaction @account, @bank_account

    @detail_transaction, @children = create_transaction_and_children(@account, @bank_account, contact: @contact, category: @category)

  end

  test 'should move transactions to a category' do
    transactions = @account.transactions

    result = Transactions::BulkMoveTo.call(account: @account, transactions:, params: { category_id: @category.id })

    assert result.success?
    assert_equal 8, transactions.count
    @account.transactions.each do |transaction|
      assert_equal @category.id, transaction.category_id
    end

  end

  test 'should move transactions to a contact' do
    transactions = @account.transactions

    result = Transactions::BulkMoveTo.call(
      account: @account, transactions:,
      params: { contact_id: @contact.id }
    )

    assert result.success?
    assert_equal 8, transactions.count
    @account.transactions.each do |transaction|
      assert_equal @contact.id, transaction.contact_id
    end
  end

  test 'should move transactions to a transaction type' do
    transactions = @account.transactions

    result = Transactions::BulkMoveTo.call(
      account: @account, transactions:,
      params: { transaction_type: :variable_expense }
    )

    assert result.success?
    assert_equal 8, transactions.count
    @account.transactions.each do |transaction|
      assert_equal :variable_expense, transaction.transaction_type
    end
  end

  test 'should move transactions to a cost center' do
    transactions = @account.transactions

    result = Transactions::BulkMoveTo.call(
      account: @account, transactions:,
      params: { cost_center_id: @cost_center.id }
    )

    assert result.success?
    assert_equal 8, transactions.count
    @account.transactions.each do |transaction|
      assert_equal @cost_center.id, transaction.cost_center_id
    end
  end

  test 'should move transactions to a bank account' do
    transactions = @account.transactions

    result = Transactions::BulkMoveTo.call(
      account: @account, transactions:,
      params: { bank_account_id: @bank_account.id }
    )

    assert result.success?
    assert_equal 8, transactions.count
    @account.transactions.each do |transaction|
      assert_equal @bank_account.id, transaction.bank_account_id
    end
  end

  test 'should move transactions to a category and contact' do
    transactions = @account.transactions

    # move 3 transactions
    result = Transactions::BulkMoveTo.call(
      account: @account, transactions:,
      params: { category_id: @category.id, contact_id: @contact.id }
    )

    assert result.success?
    assert_equal 8, transactions.count
    @account.transactions.each do |transaction|
      assert_equal @category.id, transaction.category_id
      assert_equal @contact.id, transaction.contact_id
    end
  end

  test 'should move transactions to a category and cost center' do
    transactions = @account.transactions

    result = Transactions::BulkMoveTo.call(
      account: @account, transactions:,
      params: { category_id: @category.id, cost_center_id: @cost_center.id }
    )

    assert result.success?
    assert_equal 8, transactions.count
    @account.transactions.each do |transaction|
      assert_equal @category.id, transaction.category_id
      assert_equal @cost_center.id, transaction.cost_center_id
    end
  end

  test 'should move transactions to a category and bank account' do
    transactions = @account.transactions

    result = Transactions::BulkMoveTo.call(
      account: @account, transactions:,
      params: { category_id: @category.id, bank_account_id: @bank_account.id }
    )

    assert result.success?
    assert_equal 8, transactions.count
    @account.transactions.each do |transaction|
      assert_equal @category.id, transaction.category_id
      assert_equal @bank_account.id, transaction.bank_account_id
    end
  end

  test 'should move detailed transactions to a category' do
    transaction = @detail_transaction

    result = Transactions::BulkMoveTo.call(
      account: @account, transactions: [transaction],
      params: { category_id: @category.id }
    )

    assert result.success?

    transaction.children.each do |detailed_transaction|
      assert_equal @category.id, detailed_transaction.category_id
    end
  end

  test 'should move detailed transactions to a contact' do
    transaction = @detail_transaction

    result = Transactions::BulkMoveTo.call(
      account: @account, transactions: [transaction],
      params: { contact_id: @contact.id }
    )

    assert result.success?

    transaction.children.each do |detailed_transaction|
      assert_equal @contact.id, detailed_transaction.contact_id
    end
  end

  test 'should move detailed transactions to a transaction type' do
    transaction = @detail_transaction

    result = Transactions::BulkMoveTo.call(
      account: @account, transactions: [transaction],
      params: { transaction_type: :variable_expense }
    )

    assert result.success?

    transaction.children.each do |detailed_transaction|
      assert_equal :variable_expense, detailed_transaction.transaction_type
    end
  end

  test 'should move detailed transactions to a cost center' do

    transaction = @detail_transaction

    result = Transactions::BulkMoveTo.call(
      account: @account, transactions: [transaction],
      params: { cost_center_id: @cost_center.id }
    )

    assert result.success?

    transaction.children.each do |detailed_transaction|
      assert_equal @cost_center.id, detailed_transaction.cost_center_id
    end
  end

  test 'should move detailed transactions to a bank account' do
    transaction = @detail_transaction

    result = Transactions::BulkMoveTo.call(
      account: @account, transactions: [transaction],
      params: { bank_account_id: @bank_account.id }
    )

    assert result.success?

    transaction.children.each do |detailed_transaction|
      assert_equal @bank_account.id, detailed_transaction.bank_account_id
    end
  end

  test 'should move detailed transactions to a category and contact' do
    transaction = @detail_transaction

    result = Transactions::BulkMoveTo.call(
      account: @account, transactions: [transaction],
      params: { category_id: @category.id, contact_id: @contact.id }
    )

    assert result.success?

    transaction.children.each do |detailed_transaction|
      assert_equal @category.id, detailed_transaction.category_id
      assert_equal @contact.id, detailed_transaction.contact_id
    end
  end

  test 'should move detailed transactions to a category and cost center' do
    transaction = @detail_transaction

    result = Transactions::BulkMoveTo.call(
      account: @account, transactions: [transaction],
      params: { category_id: @category.id, cost_center_id: @cost_center.id }
    )

    assert result.success?

    transaction.children.each do |detailed_transaction|
      assert_equal @category.id, detailed_transaction.category_id
      assert_equal @cost_center.id, detailed_transaction.cost_center_id
    end
  end

  test 'should move detailed transactions to a category and bank account' do
    transaction = @detail_transaction

    result = Transactions::BulkMoveTo.call(
      account: @account, transactions: [transaction],
      params: { category_id: @category.id, bank_account_id: @bank_account.id }
    )

    assert result.success?

    transaction.children.each do |detailed_transaction|
      assert_equal @category.id, detailed_transaction.category_id
      assert_equal @bank_account.id, detailed_transaction.bank_account_id
    end
  end

  test 'should move detailed transactions to a contact and cost center' do
    transaction = @detail_transaction

    result = Transactions::BulkMoveTo.call(
      account: @account, transactions: [transaction],
      params: { contact_id: @contact.id, cost_center_id: @cost_center.id }
    )

    assert result.success?

    transaction.children.each do |detailed_transaction|
      assert_equal @contact.id, detailed_transaction.contact_id
      assert_equal @cost_center.id, detailed_transaction.cost_center_id
    end
  end
end
