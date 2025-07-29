require "application_system_test_case"

class HelpUsersTest < ApplicationSystemTestCase
  setup do
    @help_user = help_users(:one)
  end

  test "visiting the index" do
    visit help_users_url
    assert_selector "h1", text: "Help users"
  end

  test "should create help user" do
    visit help_users_url
    click_on "New help user"

    fill_in "Description", with: @help_user.description
    fill_in "Link", with: @help_user.link
    fill_in "Title", with: @help_user.title
    click_on "Create Help user"

    assert_text "Help user was successfully created"
    click_on "Back"
  end

  test "should update Help user" do
    visit help_user_url(@help_user)
    click_on "Edit this help user", match: :first

    fill_in "Description", with: @help_user.description
    fill_in "Link", with: @help_user.link
    fill_in "Title", with: @help_user.title
    click_on "Update Help user"

    assert_text "Help user was successfully updated"
    click_on "Back"
  end

  test "should destroy Help user" do
    visit help_user_url(@help_user)
    click_on "Destroy this help user", match: :first

    assert_text "Help user was successfully destroyed"
  end
end
