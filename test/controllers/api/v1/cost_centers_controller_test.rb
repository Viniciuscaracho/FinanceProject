require "test_helper"

class Api::V1::CostCentersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    # Flipper.enable(:api, @account)

    @cost_center = create_cost_center(@account)
    @api_token_without_permission = create_api_token(@account, @user)
    @api_token_with_permission = create_api_token(@account, @user, permissions: { cost_center: { read: true, create: true, edit: true, remove: true } })
  end

  # make the tests without token in index, show, create, update, and destroy pass

  test "should not get index without token" do
    get api_v1_cost_centers_url(format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not get show without token" do
    get api_v1_cost_center_url(@cost_center, format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not create cost_center without token" do
    assert_no_difference("CostCenter.count") do
      post api_v1_cost_centers_url(format: :json), params: { cost_center: { name: "test" } },
           headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :forbidden
  end

  test "should not update cost_center without token" do
    patch api_v1_cost_center_url(@cost_center, format: :json), params: { cost_center: { name: "test" } },
          headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not destroy cost_center without token" do
    cost_center = create_cost_center(@account)
    assert_no_difference("CostCenter.count") do
      delete api_v1_cost_center_url(cost_center, format: :json),
             headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :forbidden
  end

  test "should get index with token" do
    get api_v1_cost_centers_url(format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should get show with token" do
    get api_v1_cost_center_url(@cost_center, format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should create cost_center with token" do
    assert_difference("CostCenter.count") do
      post api_v1_cost_centers_url(format: :json), params: { cost_center: { name: "test" } },
           headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    end
    assert_response :created
  end

  test "should update cost_center with token" do
    patch api_v1_cost_center_url(@cost_center, format: :json), params: { cost_center: { name: "test" } },
          headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should destroy cost_center with token" do
    cost_center = create_cost_center(@account)
    assert_difference("CostCenter.count", -1) do
      delete api_v1_cost_center_url(cost_center, format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    end
    assert_response :success
  end

end