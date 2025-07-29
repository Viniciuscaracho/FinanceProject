# frozen_string_literal: true

require 'test_helper'

class HomeControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    sign_in @user
  end

  test 'should get index' do
    get root_url
    assert_response :success
  end
end
