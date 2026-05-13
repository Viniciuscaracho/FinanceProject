require "test_helper"

class Api::V1::ContactsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @contact = create_contact(@account)
    @auth_token = generate_auth_token(@user)
  end

  test "should not get index without token" do
    get api_v1_contacts_url(format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :unauthorized
  end

  test "should not get show without token" do
    get api_v1_contact_url(@contact, format: :json), headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :unauthorized
  end

  test "should not create contact without token" do
    assert_no_difference("Contact.count") do
      post api_v1_contacts_url(format: :json), params: { name: "test" },
           headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :unauthorized
  end

  test "should not update contact without token" do
    patch api_v1_contact_url(@contact, format: :json), params: { name: "test" },
          headers: { "Authorization" => "Bearer invalid_token" }
    assert_response :unauthorized
  end

  test "should not destroy contact without token" do
    contact = create_contact(@account)
    assert_no_difference("Contact.count") do
      delete api_v1_contact_url(contact, format: :json),
             headers: { "Authorization" => "Bearer invalid_token" }
    end
    assert_response :unauthorized
  end

  test "should get index with token" do
    get api_v1_contacts_url(format: :json), headers: { "Authorization" => "Bearer #{@auth_token}" }
    assert_response :success
  end

  test "should get show with token" do
    get api_v1_contact_url(@contact, format: :json), headers: { "Authorization" => "Bearer #{@auth_token}" }
    assert_response :success
  end

  test "should create contact with token" do
    assert_difference("Contact.count") do
      post api_v1_contacts_url(format: :json), params: {
        contact: {
          name: "Test Contact",
          contact_type: "customer",
          email: "test@example.com",
          phone: "(11) 99999-9999"
        }
      }, headers: { "Authorization" => "Bearer #{@auth_token}" }
    end
    assert_response :created
  end

  test "should update contact with token" do
    patch api_v1_contact_url(@contact, format: :json),
          params: { contact: { name: "Updated Name" } },
          headers: { "Authorization" => "Bearer #{@auth_token}" }
    assert_response :success
  end

  test "should destroy contact with token" do
    contact = create_contact(@account)
    assert_difference("Contact.count", -1) do
      delete api_v1_contact_url(contact, format: :json),
             headers: { "Authorization" => "Bearer #{@auth_token}" }
    end
    assert_response :success
  end
end
