require "test_helper"

class Api::V1::TransactionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @bank_account = create_bank_account(@account)
    @transaction = create_transaction(@account, @bank_account)
    @auth_token = generate_auth_token(@user)

    @valid_params = {
      transaction: {
        name: "Test Transaction",
        description: "Test description",
        amount_cents: 1000,
        amount_currency: "BRL",
        transaction_type_cd: 0,
        due_date: Date.current.iso8601,
        bank_account_id: @bank_account.id,
        paid: false
      }
    }
  end

  test "should not get index without token" do
    get api_v1_transactions_url, headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :unauthorized
  end

  test "should not create transaction without token" do
    assert_no_difference("Transaction.count") do
      post api_v1_transactions_url, params: @valid_params, headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :unauthorized
  end

  test "should not update transaction without token" do
    patch api_v1_transaction_url(@transaction), params: @valid_params, headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :unauthorized
  end

  test "should not destroy transaction without token" do
    assert_no_difference("Transaction.count") do
      delete api_v1_transaction_url(@transaction), headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :unauthorized
  end

  test "should get index with token" do
    get api_v1_transactions_url(format: :json), headers: { "Authorization" => "Bearer #{@auth_token}" }
    assert_response :success
  end

  test "should get show with token" do
    get api_v1_transaction_url(@transaction, format: :json), headers: { "Authorization" => "Bearer #{@auth_token}" }
    assert_response :success
  end

  test "should create transaction with token" do
    assert_difference("Transaction.count") do
      post api_v1_transactions_url(format: :json), params: @valid_params, headers: { "Authorization" => "Bearer #{@auth_token}" }
    end
    assert_response :created
  end

  test "should update transaction with token" do
    patch api_v1_transaction_url(@transaction, format: :json),
          params: { transaction: { description: "Updated description" } },
          headers: { "Authorization" => "Bearer #{@auth_token}" }
    assert_response :success
  end

  test "should destroy transaction with token" do
    transaction = create_transaction(@account, @bank_account)
    assert_difference("Transaction.count", -1) do
      delete api_v1_transaction_url(transaction, format: :json), headers: { "Authorization" => "Bearer #{@auth_token}" }
    end
    assert_response :success
  end
end
