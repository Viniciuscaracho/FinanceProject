# frozen_string_literal: true

require 'test_helper'

class ContactsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @contact = create_contact(@account)
    sign_in(@user)
  end

  test 'should get index' do
    get contacts_url
    assert_response :success
  end

  test 'should get new' do
    get new_contact_url
    assert_response :success
  end

  test 'should create contact' do
    assert_difference('Contact.count') do
      post contacts_url, params: { contact: { description: @contact.description, name: @contact.name } }
    end

    assert_redirected_to contacts_url(contact_type: @contact.contact_type)
  end

  test 'should show contact' do
    get contact_url(@contact)
    assert_response :success
  end

  test 'should get edit' do
    get edit_contact_url(@contact)
    assert_response :success
  end

  test 'should update contact' do
    patch contact_url(@contact), params: { contact: { description: Faker::Lorem.paragraph, name: Faker::Company.name } }
    assert_redirected_to contacts_url(contact_type: @contact.contact_type)
  end

  test 'should destroy contact' do
    assert_difference('Contact.count', -1) do
      delete contact_url(@contact)
    end

    assert_redirected_to contacts_url
  end
end
