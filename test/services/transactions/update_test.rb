# frozen_string_literal: true

require 'test_helper'

module Transactions
  class UpdateTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @bank_account = @account.default_bank_account
      @contact      = create_contact @account
      @category     = create_category @account
      @transaction  = create_transaction @account, @bank_account, contact: @contact, category: @category

      @transaction_params = {
        transaction_type: @transaction.transaction_type,
        amount_cents: 20_000,
        amount_currency: @transaction.amount_currency,
        category_id: @transaction.category_id,
        contact_id: @transaction.contact_id,
        bank_account_id: @transaction.bank_account_id,
        cost_center_id: @transaction.cost_center_id,
        name: @transaction.name,
        description: @transaction.description,
        due_date: @transaction.due_date,
        paid: @transaction.paid,
        payment_method: @transaction.payment_method,
        payment_type: @transaction.payment_type,
        competency_date: @transaction.competency_date
      }
    end

    test 'should update a transaction with name and description changed' do
      transaction_params = {
        name: Faker::Lorem.sentence,
        description: Faker::Lorem.paragraph
      }
      result = Transactions::Update.call(
        account: @account,
        transaction: @transaction,
        transaction_params: transaction_params.except(:payment_type)
      )

      @transaction.reload

      assert result.success?
      assert_equal transaction_params[:name], @transaction.name
      assert_equal transaction_params[:description], @transaction.description
      assert_equal 1, @account.transactions.count
    end

    test 'should create a paid transaction' do
      transaction_params = @transaction_params.merge(paid: true)
      result = Transactions::Create.call(account: @account, grouped_expenses?: false, transaction_params:)
      assert result.success?
      assert result.transaction.paid
      assert_equal transaction_params[:paid], result.transaction.paid
      assert_equal transaction_params[:name], result.transaction.name
      assert_equal transaction_params[:description], result.transaction.description
    end

    test 'should create a paid transaction with tag list' do
      transaction_params = @transaction_params.merge(paid: true, tag_list: %w[tag1 tag2])
      result = Transactions::Create.call(account: @account, grouped_expenses?: false, transaction_params:)
      assert result.success?
      assert result.transaction.paid
      assert_equal transaction_params[:paid], result.transaction.paid
      assert_equal transaction_params[:name], result.transaction.name
      assert_equal transaction_params[:description], result.transaction.description
      assert_equal transaction_params[:tag_list], result.transaction.tag_list
    end
  end
end
