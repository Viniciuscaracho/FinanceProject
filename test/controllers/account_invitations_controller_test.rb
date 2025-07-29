# frozen_string_literal: true

require 'test_helper'

class AccountInvitationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @account_invitation = create_account_invitation(@account, @user)
    sign_in(@user)
  end

  test 'should create account_invitation' do
    if @user.account.can_add_user?
      assert_difference('AccountInvitation.count', 1) do
        @account_invitation = post account_invitations_url,
                                   params: {
                                     account_invitation: {
                                       account_id: @account.id,
                                       email: Faker::Internet.email,
                                       name: Faker::Name.name,
                                       invited_by_id: @user.id,
                                       role: :custom,
                                       token: Faker::Internet.device_token
                                     }
                                   }
      end
      assert_redirected_to account_invitations_url
    end
  end

  test 'should get index' do
    get account_invitations_url
    assert_response :success
  end

  test 'should get new' do
    get new_account_invitation_url
    assert_response :success
  end

  test 'should show account_invitation and redirect to root page' do
    get account_invitation_url(@account_invitation)

    assert_response :success
  end

  test 'should show account_invitation and redirect to sign_up page' do
    sign_out(@user)
    get account_invitation_url(@account_invitation)

    assert_redirected_to new_user_registration_path(invite: @account_invitation.token)
  end

  test 'should show account_invitation and redirect to sign_in page' do
    sign_out(@user)
    user, = register_user(email: @account_invitation.email)
    get account_invitation_url(@account_invitation)

    assert_equal @account_invitation.email, user.email
    assert_redirected_to new_user_session_path(invite: @account_invitation.token)
  end

  test 'should edit a account' do
    @account_invitation = create_account_invitation(@account, @user)
    get edit_account_invitation_url(@account_invitation.id)
    assert_response :success
  end

  test 'should update account_invitation' do
    @account_invitation = create_account_invitation(@account, @user)
    patch account_invitation_url(@account_invitation.id),
          params: { account_invitation: { role: :admin } }
    assert_redirected_to root_path
  end

  test 'should destroy account_invitation' do
    @account_invitation = create_account_invitation(@account, @user)
    assert_difference('AccountInvitation.count', -1) do
      delete account_invitation_url(@account_invitation.id)
    end
    assert_redirected_to account_invitations_url
  end
end
