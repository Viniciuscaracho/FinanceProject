require "test_helper"

class Api::V1::UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    # Flipper.enable(:api, @account)

    @api_token_without_permission = create_api_token(@account, @user)

    @api_token_with_permission = create_api_token(@account, @user, permissions: { user: { read: true, edit: true } })
  end

  # make the tests without token in index, show, update pass
  test "should not get index without token" do
    get api_v1_users_url(format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not get show without token" do
    get api_v1_user_url(@user, format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not update user without token" do
    patch api_v1_user_url(@user, format: :json), params: { user: { name: "test" } }, headers: {
      "Authorization" => "Bearer invalid_token"
    }
    assert_response :forbidden

  end

  test "should get index with token with permission" do
    get api_v1_users_url(format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should get show with token with permission" do
    get api_v1_user_url(@user, format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should update user with token with permission" do
    patch api_v1_user_url(@user, format: :json), params: { user: { name: "test" } },
          headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end
end