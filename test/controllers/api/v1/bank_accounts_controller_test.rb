require "test_helper"

class Api::V1::BankAccountsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @bank_account = create_bank_account(@account)
    @auth_token = generate_auth_token(@user)
  end

  test "should not get index without token" do
    get api_v1_bank_accounts_url(format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :unauthorized
  end

  test "should not get show without token" do
    get api_v1_bank_account_url(@bank_account, format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :unauthorized
  end

  test "should not create bank_account without token" do
    assert_no_difference("BankAccount.count") do
      post api_v1_bank_accounts_url(format: :json), params: { bank_account: { name: "test" } },
           headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :unauthorized
  end

  test "should not update bank_account without token" do
    patch api_v1_bank_account_url(@bank_account, format: :json), params: { bank_account: { name: "test" } },
          headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :unauthorized
  end

  test "should not destroy bank_account without token" do
    bank_account = create_bank_account(@account, default: false)
    assert_no_difference("BankAccount.count") do
      delete api_v1_bank_account_url(bank_account, format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :unauthorized
  end

  test "should get index with token" do
    get api_v1_bank_accounts_url(format: :json), headers: { "Authorization" => "Bearer #{@auth_token}" }
    assert_response :success
  end

  test "should get show with token" do
    get api_v1_bank_account_url(@bank_account, format: :json), headers: { "Authorization" => "Bearer #{@auth_token}" }
    assert_response :success
  end

  test "should create bank_account with token" do
    assert_difference("BankAccount.count") do
      post api_v1_bank_accounts_url(format: :json), params: { bank_account: { name: "test" } },
           headers: { "Authorization" => "Bearer #{@auth_token}" }
    end
    assert_response :created
  end

  test "should update bank_account with token" do
    patch api_v1_bank_account_url(@bank_account, format: :json), params: { bank_account: { name: "test" } },
          headers: { "Authorization" => "Bearer #{@auth_token}" }
    assert_response :success
  end

  test "should destroy bank_account with token" do
    bank_account = create_bank_account(@account, default: false)
    assert_difference("BankAccount.count", -1) do
      delete api_v1_bank_account_url(bank_account, format: :json), headers: { "Authorization" => "Bearer #{@auth_token}" }
    end
    assert_response :success
  end

  test "should archive bank_account with token when it has transactions" do
    bank_account = create_bank_account(@account, default: false)
    create_transaction(@account, bank_account)
    assert_no_difference("BankAccount.count") do
      delete api_v1_bank_account_url(bank_account, format: :json), headers: { "Authorization" => "Bearer #{@auth_token}" }
    end
    assert_equal true, bank_account.reload.archived?
    assert_response :success
  end

  test "should not destroy default bank_account" do
    assert_no_difference("BankAccount.count") do
      delete api_v1_bank_account_url(@bank_account, format: :json), headers: { "Authorization" => "Bearer #{@auth_token}" }
    end
    assert_response :unprocessable_entity
  end
end
