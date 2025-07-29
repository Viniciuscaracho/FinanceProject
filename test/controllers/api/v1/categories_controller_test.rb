require "test_helper"

class Api::V1::CategoriesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    # Flipper.enable(:api, @account)

    @category = create_category(@account)
    @api_token_without_permission = create_api_token(@account, @user)
    @api_token_with_permission = create_api_token(@account, @user, permissions: { category: { read: true, create: true, edit: true, remove: true } })
  end

  # make the tests without token in index, show, create, update, and destroy pass
  test "should not get index without token" do
    get api_v1_categories_url(format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not get show without token" do
    get api_v1_category_url(@category, format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not create category without token" do
    assert_no_difference("Category.count") do
      post api_v1_categories_url(format: :json), params: { category: { name: "test" } },
           headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :forbidden
  end

  test "should not update category without token" do
    patch api_v1_category_url(@category, format: :json), params: { category: { name: "test" } },
          headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not destroy category without token" do
    category = create_category(@account)
    assert_no_difference("Category.count") do
      delete api_v1_category_url(category, format: :json),
             headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :forbidden
  end

  test "should get index with token" do
    get api_v1_categories_url(format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should get show with token" do
    get api_v1_category_url(@category, format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should create category with token" do
    assert_difference("Category.count") do
      post api_v1_categories_url(format: :json), params: { "name": "Nome", "description": "Descrição", "transaction_type": "revenue" },
           headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    end
    assert_response :success
  end

  test "should update category with token" do
    patch api_v1_category_url(@category, format: :json), params: { category: { name: "test" } },
          headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should destroy category with token" do
    category = create_category(@account)
    assert_difference("Category.count", -1) do
      delete api_v1_category_url(category, format: :json),
             headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    end
    assert_response :success
  end

end