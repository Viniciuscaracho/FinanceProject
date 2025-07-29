# frozen_string_literal: true

require 'test_helper'

class TransactionFilterableTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @bank_account = create_bank_account(@account)
    @category = create_category(@account)
    @contact = create_contact(@account)
    @cost_center = create_cost_center(@account)

    create_transactions

  end

  test 'should return correct transactions when call filter_by with bank_account_ids' do

    transactions = @account.transactions.filter_by(bank_account_ids: [@bank_account.id])

    assert_equal 21, transactions.count
  end

  test 'should return correct transactions when call filter_by with cost_center_ids' do

    transactions = @account.transactions.filter_by(cost_center_ids: [@cost_center.id])

    assert_equal 7, transactions.count
  end

  test 'should return correct transactions when call filter_by with date_type' do

    transactions = @account.transactions.filter_by(date_type: :due_date)

    assert_equal 26, transactions.count
  end

  test 'should return correct transactions when call filter_by with paid' do

    transactions = @account.transactions.filter_by(paid: true)

    assert_equal 6, transactions.count
  end

  test 'should return correct transactions when call filter_by with unpaid' do

    transactions = @account.transactions.filter_by(paid: false)

    assert_equal 20, transactions.count
  end

  test 'should return correct transactions when call filter_by with paid and unpaid' do

    transactions = @account.transactions.filter_by(paid: [true, false])

    assert_equal 26, transactions.count
  end

  test 'should return correct transactions when call filter_by with tag_list' do

    transactions = @account.transactions.filter_by(tag_list: ['Test'])

    assert_equal 6, transactions.count
  end

  test 'should return correct transactions when call filter_by with category_ids' do

    transactions = @account.transactions.filter_by(category_ids: [@category.id])

    assert_equal 6, transactions.count
  end

  test 'should return correct transactions when call filter_by with payment_methods' do

    transactions = @account.transactions.filter_by(payment_methods: [:credit_card])

    assert_equal 12, transactions.count
  end

  test 'should return correct transactions when call filter_by with multiple filters' do

    transactions = @account.transactions.filter_by(
      bank_account_ids: [@bank_account.id],
      cost_center_ids: [@cost_center.id],
      date_type: :due_date,
      paid: true,
      tag_list: ['Test'],
      category_ids: [@category.id],
      payment_methods: [:credit_card]
    )

    assert_equal 1, transactions.count
  end

  private

  def create_transactions

    create_transaction(@account, @bank_account,
                       name: 'Test', amount_cents: 1500, exchanged_amount_cents: 1500,
                       contact: @contact, category: @category, cost_center: @cost_center,
                       payment_method: :credit_card, paid: true, tag_list: 'Test')

    2.times do
      create_transaction(@account, @bank_account,
                         name: nil, category: nil, contact: nil, cost_center: nil,
                         amount_cents: 1500, exchanged_amount_cents: 1500, transaction_type: :fixed_expense,
                         payment_method: :no_payment_method)

    end

    3.times do
      create_transaction(@account, @bank_account,
                         name: 'Test', amount_cents: 1500, exchanged_amount_cents: 1500,
                         contact: nil, category: nil, cost_center: nil, payment_method: :no_payment_method)
    end

    4.times do
      create_transaction(@account, @bank_account,
                         name: nil, contact: @contact, category: nil, cost_center: nil,
                         amount_cents: 1500, exchanged_amount_cents: 1500, payment_method: :no_payment_method)
    end

    5.times do
      create_transaction(@account, @bank_account,
                         name: nil, contact: nil, category: @category, cost_center: nil,
                         amount_cents: 1500, exchanged_amount_cents: 1500, payment_method: :credit_card,
                         paid: true, tag_list: 'Test')
    end

    6.times do
      create_transaction(@account, @bank_account,
                         name: nil, contact: nil, category: nil, amount_cents: 1500,
                         exchanged_amount_cents: 1500, cost_center: @cost_center, payment_method: :credit_card)

    end

    5.times do
      create_transaction(@account, create_bank_account(@account))
    end
  end
end