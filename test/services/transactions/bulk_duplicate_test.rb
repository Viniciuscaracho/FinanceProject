# frozen_string_literal: true

require 'test_helper'

module Transactions
  class BulkDuplicateTest < ActiveSupport::TestCase
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

      @detail_transaction, @children = create_transaction_and_children(@account, @bank_account, contact: @contact, category: @category)
    end

    test 'should duplicate transactions with children' do
      transactions = @account.transactions.only_parents

      result = Transactions::BulkDuplicate.call(account: @account, transactions:)

      assert result.success?
      assert_equal 16, @account.transactions.count
    end

    # Esse teste está errado, não existe o parâmetro params para atualizar uma categoria ou algum parâmetro

    # test 'should duplicate transactions with children' do
    #   transactions = @account.transactions.only_parents
    #
    #   result = Transactions::BulkDuplicate.call(account: @account, transactions:)
    #
    #   assert result.success?
    #   assert_equal 16, @account.transactions.count
    # end

  end
end

