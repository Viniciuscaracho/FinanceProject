# frozen_string_literal: true

require 'test_helper'

class TransactionReportsMethodsTest < ActiveSupport::TestCase

  setup do
    _, @account = register_user
    @bank_account = create_bank_account(@account)
    @category = create_category(@account)
    @contact = create_contact(@account)
    @cost_center = create_cost_center(@account)

    create_transactions

  end

  test 'should return correct transactions when call descriptions_with_amount_to_hash' do

    result = @account.transactions.descriptions_with_amount_to_hash
    descriptions_with_amount_to_hash_result = {
      'Test' => 45.0,
      nil => 255.0
    }
    assert_equal descriptions_with_amount_to_hash_result, result
  end

  test 'should return correct transactions when call contact_with_amount_to_hash' do

    result = @account.transactions.contact_with_amount_to_hash
    contact_with_amount_to_hash_result = {
      [@contact.first_name, @contact.last_name, @contact.id] => 60.0,
      [nil, nil, nil] => 240.0
    }
    assert_equal contact_with_amount_to_hash_result, result
  end

  test 'should return correct transactions when call categories_with_amount_to_hash' do

    result = @account.transactions.categories_with_amount_to_hash
    categories_with_amount_to_hash_result = {
      [@category.name, @category.id] => 75.0,
      [nil, nil] => 225.0
    }
    assert_equal categories_with_amount_to_hash_result, result
  end

  test 'should return correct transactions when call cost_centers_with_amount_to_hash' do

    result = @account.transactions.cost_centers_with_amount_to_hash
    cost_centers_with_amount_to_hash_result = {
      [@cost_center.name, @cost_center.id] => 90.0,
      [nil, nil] => 210.0
    }
    assert_equal cost_centers_with_amount_to_hash_result, result
  end

  test 'should return correct transactions when call days_with_amount_to_hash' do

    result = @account.transactions.days_with_amount_to_hash
    days_with_amount_to_hash_result = {
      Date.today => 30000
    }
    assert_equal days_with_amount_to_hash_result, result
  end

  test 'should return correct transactions when call transaction_type_with_amount_to_hash' do

    result = @account.transactions.transaction_type_with_amount_to_hash
    transaction_type_with_amount_to_hash_result = {
      0 => 270.0,
      1 => 30.0
    }
    assert_equal transaction_type_with_amount_to_hash_result, result
  end

  test 'should return correct transactions when call months_with_amount_to_hash' do

    result = @account.transactions.months_with_amount_to_hash
    months_with_amount_to_hash_result = {
      Date.today.beginning_of_month => 30000
    }
    assert_equal months_with_amount_to_hash_result, result
  end

  test 'should return correct transactions when call years_with_amount_to_hash' do

    result = @account.transactions.years_with_amount_to_hash
    years_with_amount_to_hash_result = {
      Date.today.beginning_of_year => 30000
    }
    assert_equal years_with_amount_to_hash_result, result
  end

  test 'should return correct transactions when call payment_method_with_amount_to_hash' do

    result = @account.transactions.payment_method_with_amount_to_hash
    payment_method_with_amount_to_hash_result = {
      0 => 135.0,
      1 => 165.0
    }
    assert_equal payment_method_with_amount_to_hash_result, result
  end

  private

  def create_transactions
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
                         amount_cents: 1500, exchanged_amount_cents: 1500, payment_method: :credit_card)
    end

    6.times do
      create_transaction(@account, @bank_account,
                         name: nil, contact: nil, category: nil, amount_cents: 1500,
                         exchanged_amount_cents: 1500, cost_center: @cost_center, payment_method: :credit_card)

    end
  end
end