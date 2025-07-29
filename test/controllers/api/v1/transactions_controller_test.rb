require "test_helper"

class Api::V1::TransactionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    # Flipper.enable(:api, @account)

    @bank_account = create_bank_account(@account)
    @api_token_without_permission = create_api_token(@account, @user)

    @transaction = create_transaction(@account, @bank_account)

    @api_token_with_permission = create_api_token(@account, @user, permissions: { transaction: { read: true, create: true, edit: true, remove: true } })
  end

  # make the tests without token in index, show, create, update, and destroy pass
  test "should not get index without token" do
    get api_v1_transactions_url, headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not get show without token" do
    transaction = create_transaction(@account, @bank_account)
    get api_v1_transaction_url(transaction), headers: { "Authorization" => "Bearer invalid_token" }
  end

  test "should not create transaction without token" do
    assert_no_difference("Transaction.count") do
      post api_v1_transactions_url, params: { transaction: { amount: 100, date: "2021-01-01", description: "test" } }, headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :forbidden
  end

  test "should not update transaction without token" do
    transaction = create_transaction(@account, @bank_account)
    patch api_v1_transaction_url(transaction), params: { transaction: { amount: 100, date: "2021-01-01", description: "test" } }, headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not destroy transaction without token" do
    transaction = create_transaction(@account, @bank_account)
    assert_no_difference("Transaction.count") do
      delete api_v1_transaction_url(transaction), headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :forbidden
  end

  # make the tests with token in index, show, create, update, and destroy pass

  test "should get index with token" do

    #  in json formtat
    get api_v1_transactions_url(format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should get show with token" do
    transaction = create_transaction(@account, @bank_account)
    get api_v1_transaction_url(transaction, format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should create transaction with token" do

    assert_difference("Transaction.count") do
      post api_v1_transactions_url(format: :json), params: { **@transaction.attributes }, headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    end
    assert_response :created
  end

  test "should update transaction with token" do
    transaction = create_transaction(@account, @bank_account)
    patch api_v1_transaction_url(transaction, format: :json), params: { **@transaction.attributes }, headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should destroy transaction with token" do
    transaction = create_transaction(@account, @bank_account)
    assert_difference("Transaction.count", -1) do
      delete api_v1_transaction_url(transaction, format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    end
    assert_response :ok
  end

end
