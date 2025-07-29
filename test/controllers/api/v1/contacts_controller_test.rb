require "test_helper"

class Api::V1::ContactsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    # Flipper.enable(:api, @account)

    @contact = create_contact(@account)
    @api_token_without_permission = create_api_token(@account, @user)

    @api_token_with_permission = create_api_token(@account, @user, permissions: { contact: { read: true, create: true, edit: true, remove: true } })
  end

  # make the tests without token in index, show, create, update, and destroy pass
  test "should not get index without token" do
    get api_v1_contacts_url(format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not get show without token" do
    get api_v1_contact_url(@contact, format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not create contact without token" do
    assert_no_difference("Contact.count") do
      post api_v1_contacts_url(format: :json), params: { contact: { name: "test" } },
           headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :forbidden
  end

  test "should not update contact without token" do
    patch api_v1_contact_url(@contact, format: :json), params: { contact: { name: "test" } },
          headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :forbidden
  end

  test "should not destroy contact without token" do
    contact = create_contact(@account)
    assert_no_difference("Contact.count") do
      delete api_v1_contact_url(contact, format: :json),
             headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :forbidden
  end

  test "should get index with token" do
    get api_v1_contacts_url(format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should get show with token" do
    get api_v1_contact_url(@contact, format: :json), headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should create contact with token" do
    assert_difference("Contact.count") do

      post api_v1_contacts_url(format: :json), params: {
        "document_1": "99.999.999/9999-99",
        "name": "Nome no",
        "contact_type": "customer",
        "person_type": "natural",
        "document_2": "9999999999999",
        "sector_activity_id": "",
        "email": "exemplo@hotmail.com",
        "phone_number": "(99) 99999-9999",
        "cell_phone_number": "(99) 99999-9999",
        "birth_date": "2004-12-03",
        "description": ""
      },
      headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    end
    assert_response :created
  end

  test "should update contact with token" do
    patch api_v1_contact_url(@contact, format: :json), params: { name: "test" },
          headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    assert_response :success
  end

  test "should destroy contact with token" do
    contact = create_contact(@account)
    assert_difference("Contact.count", -1) do
      delete api_v1_contact_url(contact, format: :json),
             headers: { "Authorization" => "Bearer " + @api_token_with_permission.token }
    end
    assert_response :success
  end

end