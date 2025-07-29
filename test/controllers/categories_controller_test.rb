# frozen_string_literal: true

require 'test_helper'

class CategoriesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @category = create_category(@account)
    sign_in(@user)
  end

  test 'should get index' do
    get categories_url

    assert_response :success, @response.body
  end

  test 'should get new' do
    get new_category_url(id: 2)
    assert_response :success
  end

  test 'should create category' do
    assert_difference('Category.count') do
      post categories_url,
           params: { category: { account: @user.id, description: @category.description,
                                 name: @category.name, type: 'Category' } }
    end

    assert_redirected_to categories_url
  end

  test 'should show category' do
    get category_url(@category)
    assert_response :success
  end

  test 'should get edit' do
    get edit_category_url(@category.id)
    assert_response :success
  end

  test 'should update category' do
    patch category_url(@category), params: { category: { description: 'Updated Description', name: 'Updated Name' } }
    assert_redirected_to categories_url
  end

  test 'should destroy category' do
    assert_difference('Category.count', -1) do
      delete category_url(@category)
    end

    assert_redirected_to categories_url
  end
end
