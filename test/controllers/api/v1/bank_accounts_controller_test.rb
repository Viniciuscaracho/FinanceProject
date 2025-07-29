require "test_helper"

class Api::V1::BankAccountsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    # Flipper.enable(:api, @account)

    @bank_account = create_bank_account(@account)
    @api_token_with_permission = create_api_token(@account, @user)
  end

  # make the tests without token in index, show, create, update, and destroy pass
  test "should not get index without token" do
    get api_v1_bank_accounts_url(format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not get show without token" do
    get api_v1_bank_account_url(@bank_account, format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not create bank_account without token" do
    assert_no_difference("BankAccount.count") do
      post api_v1_bank_accounts_url(format: :json), params: { bank_account: { name: "test" } }, headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :forbidden
  end

  test "should not update bank_account without token" do
    patch api_v1_bank_account_url(@bank_account, format: :json), params: { bank_account: { name: "test" } }, headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not destroy bank_account without token" do
    bank_account = create_bank_account(@account, default: false)
    assert_no_difference("BankAccount.count") do
      delete api_v1_bank_account_url(bank_account, format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :forbidden
  end

  test "should get index with token" do
    get api_v1_bank_accounts_url(format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should get show with token" do
    get api_v1_bank_account_url(@bank_account, format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should create bank_account with token" do
    assert_difference("BankAccount.count") do
      post api_v1_bank_accounts_url(format: :json), params: { bank_account: { name: "test" } },
           headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    end
    assert_response :created
  end

  test "should update bank_account with token" do
    patch api_v1_bank_account_url(@bank_account, format: :json), params: { bank_account: { name: "test" } },
          headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should destroy bank_account with token" do
    bank_account = create_bank_account(@account, default: false)

    assert_difference("BankAccount.count", -1) do
      delete api_v1_bank_account_url(bank_account, format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    end

    assert_response :success
  end

  test "should not destroy bank_account with token when it has transactions" do
    bank_account = create_bank_account(@account, default: false)
    create_transaction(@account, bank_account)

    assert_no_difference("BankAccount.count") do
      delete api_v1_bank_account_url(bank_account, format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    end
    assert_equal true, bank_account.reload.archived?
    assert_equal false, bank_account.destroyed?

    assert_response :success
  end

  test "should not destroy bank_account with token when it is the default" do
    assert_no_difference("BankAccount.count") do
      delete api_v1_bank_account_url(@bank_account, format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    end
    assert_response :unprocessable_entity
  end

end