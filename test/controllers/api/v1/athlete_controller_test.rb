require "test_helper"

class Api::V1::AthleteControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @auth_headers = { "Authorization" => "Bearer #{generate_auth_token(@user)}" }
  end

  # ── setup endpoint ────────────────────────────────────────────────────

  test "setup requires authentication" do
    post api_v1_athlete_setup_url(format: :json)
    assert_response :unauthorized
  end

  test "setup creates self-contact and stores id in preferences" do
    assert_difference "Contact.count", 1 do
      post api_v1_athlete_setup_url(format: :json), headers: @auth_headers
    end

    assert_response :ok
    body = response.parsed_body

    assert body["contact_id"].present?

    @account.reload
    assert_equal body["contact_id"], @account.preferences["self_contact_id"]
  end

  test "setup idempotent: calling twice does not create duplicate contacts" do
    post api_v1_athlete_setup_url(format: :json), headers: @auth_headers
    assert_response :ok
    contact_id_first = response.parsed_body["contact_id"]

    assert_no_difference "Contact.count" do
      post api_v1_athlete_setup_url(format: :json), headers: @auth_headers
    end

    assert_response :ok
    assert_equal contact_id_first, response.parsed_body["contact_id"]
  end

  test "setup creates contact with user name and email" do
    post api_v1_athlete_setup_url(format: :json), headers: @auth_headers
    assert_response :ok

    contact = Contact.find(response.parsed_body["contact_id"])
    assert_equal @user.email, contact.email
  end

  # ── self_contact endpoint ─────────────────────────────────────────────

  test "self_contact requires authentication" do
    get api_v1_athlete_self_contact_url(format: :json)
    assert_response :unauthorized
  end

  test "self_contact returns 404 when no setup done" do
    get api_v1_athlete_self_contact_url(format: :json), headers: @auth_headers
    assert_response :not_found
  end

  test "self_contact returns contact_id after setup" do
    post api_v1_athlete_setup_url(format: :json), headers: @auth_headers
    expected_id = response.parsed_body["contact_id"]

    get api_v1_athlete_self_contact_url(format: :json), headers: @auth_headers
    assert_response :ok

    body = response.parsed_body
    assert_equal expected_id, body["contact_id"]
    assert body["name"].present?
  end

  test "self_contact returns 404 when preferences missing self_contact_id" do
    @account.update_columns(preferences: {})

    get api_v1_athlete_self_contact_url(format: :json), headers: @auth_headers
    assert_response :not_found
  end
end
