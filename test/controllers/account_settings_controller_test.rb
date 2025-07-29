# frozen_string_literal: true

require 'test_helper'

class AccountInvitationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    sign_in(@user)
  end

  test 'should get edit a account' do
    get edit_account_setting_path(@account)
    assert_response :success
  end
  test 'should update a account' do
    patch account_setting_url(@account), params: { account: { name: Faker::Name.name, email: Faker::Internet.email}}
    @account.reload
    assert_redirected_to root_path
  end

  test 'should reset a account' do
    patch account_setting_reset_url(@account)
    assert_redirected_to root_path
  end
end
