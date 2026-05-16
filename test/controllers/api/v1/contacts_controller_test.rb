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

  # ── GET /api/v1/contacts/:id/last_anamnese_response ────────────────────────

  test "last_anamnese_response returns null when contact has no responses" do
    get last_anamnese_response_api_v1_contact_url(@contact, format: :json),
        headers: { "Authorization" => "Bearer #{@auth_token}" }

    assert_response :success
    body = JSON.parse(response.body)
    assert_nil body['response']
  end

  test "last_anamnese_response returns most recent response" do
    account_user = @account.account_users.first
    account_user.update!(schedule: weekday_schedule)
    service = create_service(@account)
    template = @account.anamnese_templates.create!(name: 'T', fields: [])

    t1 = next_weekday_at(10)
    t2 = next_weekday_at(12)

    appt1 = @account.appointments.create!(
      account_user: account_user, service: service, contact: @contact,
      start_time: t1, end_time: t1 + 1.hour,
      price_cents: 5000, whatsapp_number: '5511900000001',
      status: :confirmed, payment_status: :paid
    )
    appt2 = @account.appointments.create!(
      account_user: account_user, service: service, contact: @contact,
      start_time: t2, end_time: t2 + 1.hour,
      price_cents: 5000, whatsapp_number: '5511900000002',
      status: :confirmed, payment_status: :paid
    )

    ActsAsTenant.with_tenant(@account) do
      @account.anamnese_responses.create!(
        appointment: appt1, contact: @contact,
        anamnese_template: template, responses: { 'q1' => 'antiga' },
        created_at: 2.days.ago
      )
      @account.anamnese_responses.create!(
        appointment: appt2, contact: @contact,
        anamnese_template: template, responses: { 'q1' => 'recente' }
      )
    end

    get last_anamnese_response_api_v1_contact_url(@contact, format: :json),
        headers: { "Authorization" => "Bearer #{@auth_token}" }

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 'recente', body['response']['responses']['q1']
  end

  test "last_anamnese_response returns 401 without auth" do
    get last_anamnese_response_api_v1_contact_url(@contact, format: :json)
    assert_response :unauthorized
  end

  test "last_anamnese_response does not return responses from other accounts" do
    _, other_account = register_user
    other_user_token = generate_auth_token(other_account.users.first)
    other_contact    = create_contact(other_account)
    other_au         = other_account.account_users.first
    other_au.update!(schedule: weekday_schedule)
    other_service = create_service(other_account)

    t = next_weekday_at(10)
    ActsAsTenant.with_tenant(other_account) do
      other_appt = other_account.appointments.create!(
        account_user: other_au, service: other_service, contact: other_contact,
        start_time: t, end_time: t + 1.hour,
        price_cents: 5000, whatsapp_number: '5511900000099',
        status: :confirmed, payment_status: :paid
      )
      other_account.anamnese_responses.create!(
        appointment: other_appt, contact: other_contact,
        responses: { 'q' => 'outro' }
      )
    end

    # Request from original account for @contact — should not see other account's data
    get last_anamnese_response_api_v1_contact_url(@contact, format: :json),
        headers: { "Authorization" => "Bearer #{@auth_token}" }

    assert_response :success
    assert_nil JSON.parse(response.body)['response']
  end

  private

  def weekday_schedule
    %w[monday tuesday wednesday thursday friday].index_with do
      { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 }
    end
  end

  def next_weekday_at(hour)
    t = Time.current + 1.day
    t += 1.day while [0, 6].include?(t.wday)
    t.beginning_of_day + hour.hours
  end
end
