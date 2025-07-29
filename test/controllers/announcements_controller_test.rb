# frozen_string_literal: true

require 'test_helper'

class AnnouncementsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @announcement = create_announcement
    sign_in @user
  end

  test 'should get index' do
    get announcements_url
    assert_response :success
  end

  test 'should show an announcement' do
    get announcement_url(@announcement)
    assert_response :success
  end

  test 'should dismiss an announcement' do
    put dismiss_announcement_url(@announcement, { format: :turbo_stream })
    assert_response :success
  end
end
