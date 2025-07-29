# frozen_string_literal: true

require 'test_helper'

class BankAccountsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @bank_account = create_bank_account(@account)
    sign_in(@user)
  end

  test 'should get index' do
    get bank_accounts_url
    assert_response :success
  end

  test 'should get new' do
    get new_bank_account_url
    assert_response :success
  end

  test 'should create bank_account' do
    post bank_accounts_url,
         params: { bank_account: { account_type_cd: @bank_account.account_type_cd, balance_cents: @bank_account.balance_cents,
                                   balance_currency: @bank_account.balance_currency, initial_balance_cents: @bank_account.initial_balance_cents, initial_balance_currency: @bank_account.initial_balance_currency, name: @bank_account.name } }
    assert_redirected_to bank_accounts_url
  end

  test 'should show bank_account' do
    get bank_account_url(@bank_account)
    assert_response :success
  end

  test 'should get edit' do
    get edit_bank_account_url(@bank_account)
    assert_response :success
  end

  test 'should update bank_account' do
    patch bank_account_url(@bank_account),
          params: { bank_account: { account_type_cd: @bank_account.account_type_cd, balance_cents: @bank_account.balance_cents,
                                    balance_currency: @bank_account.balance_currency, initial_balance_cents: @bank_account.initial_balance_cents, initial_balance_currency: @bank_account.initial_balance_currency, name: @bank_account.name } }
    assert_redirected_to bank_accounts_url
  end
end