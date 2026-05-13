require "test_helper"

class Api::V1::UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @api_token = create_api_token(@account, @user)
  end

  test "should not get index without token" do
    get api_v1_users_url(format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not get show without token" do
    get api_v1_user_url(@user, format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not update user without token" do
    patch api_v1_user_url(@user, format: :json), params: { user: { first_name: "Test" } },
          headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should get index with token" do
    get api_v1_users_url(format: :json), headers: { "Authorization" => "Bearer #{@api_token.token}" }
    assert_response :success
  end

  test "should get show with token" do
    get api_v1_user_url(@user, format: :json), headers: { "Authorization" => "Bearer #{@api_token.token}" }
    assert_response :success
  end

  test "should update user with token" do
    patch api_v1_user_url(@user, format: :json), params: { user: { first_name: "Test" } },
          headers: { "Authorization" => "Bearer #{@api_token.token}" }
    assert_response :success
  end
end
