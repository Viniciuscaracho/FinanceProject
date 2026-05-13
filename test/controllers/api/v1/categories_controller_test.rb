require "test_helper"

class Api::V1::CategoriesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @category = create_category(@account)
    @auth_token = generate_auth_token(@user)
  end

  test "should not get index without token" do
    get api_v1_categories_url(format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :unauthorized
  end

  test "should not get show without token" do
    get api_v1_category_url(@category, format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :unauthorized
  end

  test "should not create category without token" do
    assert_no_difference("Category.count") do
      post api_v1_categories_url(format: :json), params: { category: { name: "test" } },
           headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :unauthorized
  end

  test "should not update category without token" do
    patch api_v1_category_url(@category, format: :json), params: { category: { name: "test" } },
          headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :unauthorized
  end

  test "should not destroy category without token" do
    category = create_category(@account)
    assert_no_difference("Category.count") do
      delete api_v1_category_url(category, format: :json),
             headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :unauthorized
  end

  test "should get index with token" do
    get api_v1_categories_url(format: :json), headers: { "Authorization" => "Bearer #{@auth_token}" }
    assert_response :success
  end

  test "should get show with token" do
    get api_v1_category_url(@category, format: :json), headers: { "Authorization" => "Bearer #{@auth_token}" }
    assert_response :success
  end

  test "should create category with token" do
    assert_difference("Category.count") do
      post api_v1_categories_url(format: :json), params: { category: { name: "Nome", description: "Descrição" } },
           headers: { "Authorization" => "Bearer #{@auth_token}" }
    end
    assert_response :success
  end

  test "should update category with token" do
    patch api_v1_category_url(@category, format: :json), params: { category: { name: "test" } },
          headers: { "Authorization" => "Bearer #{@auth_token}" }
    assert_response :success
  end

  test "should destroy category with token" do
    category = create_category(@account)
    assert_difference("Category.count", -1) do
      delete api_v1_category_url(category, format: :json),
             headers: { "Authorization" => "Bearer #{@auth_token}" }
    end
    assert_response :success
  end
end
