# frozen_string_literal: true

require 'test_helper'

class CostCentersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @cost_center = create_cost_center(@account)
    sign_in(@user)
  end

  test 'should get index' do
    get cost_centers_url
    assert_response :success
  end

  test 'should get new' do
    get new_cost_center_url
    assert_response :success
  end

  test 'should create domain' do
    assert_difference('CostCenter.count') do
      post cost_centers_url,
           params: { cost_center: { account: @user.id, description: @cost_center.description,
                                   name: @cost_center.name, type: @cost_center.type } }
    end

    assert_redirected_to cost_centers_url
  end

  test 'should show domain' do
    get cost_center_url(@cost_center)
    assert_response :success
  end

  test 'should get edit' do
    get edit_cost_center_url(@cost_center)
    assert_response :success
  end

  test 'should update domain' do
    patch cost_center_url(@cost_center),
          params: { cost_center: { account: @user.id, description: @cost_center.description,
                                  name: @cost_center.name, type: @cost_center.type } }
    assert_redirected_to cost_centers_url
  end

  test 'should destroy domain' do
    assert_difference('CostCenter.count', -1) do
      delete cost_center_url(@cost_center)
    end

    assert_redirected_to cost_centers_url
  end
end
