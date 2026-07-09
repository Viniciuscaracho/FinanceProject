# frozen_string_literal: true

require 'test_helper'

class Api::V1::Coaching::AlertsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @auth_token     = generate_auth_token(@user)
    @headers        = { 'Authorization' => "Bearer #{@auth_token}" }
  end

  test 'requires authentication' do
    get api_v1_coaching_alerts_url(format: :json)
    assert_response :unauthorized
  end

  test 'returns empty alerts when no profiles' do
    get api_v1_coaching_alerts_url(format: :json), headers: @headers
    assert_response :success
    assert_equal [], response.parsed_body['alerts']
  end

  test 'returns sem_feedback alert for contact with no feedback' do
    contact = create_contact(@account)
    CoachingProfile.create!(account: @account, contact: contact, last_feedback_at: nil)

    get api_v1_coaching_alerts_url(format: :json), headers: @headers
    assert_response :success

    alerts = response.parsed_body['alerts']
    assert_equal 1, alerts.size
    assert_equal 'sem_feedback',  alerts.first['alert_type']
    assert_equal contact.id,      alerts.first['contact_id']
    assert_equal contact.name,    alerts.first['contact_name']
  end

  test 'returns reavaliacao_proxima alert' do
    contact = create_contact(@account)
    CoachingProfile.create!(account: @account, contact: contact,
                            last_feedback_at:     1.day.ago,
                            next_reassessment_at: 3.days.from_now)

    get api_v1_coaching_alerts_url(format: :json), headers: @headers

    alerts = response.parsed_body['alerts']
    reavaliacao = alerts.select { |a| a['alert_type'] == 'reavaliacao_proxima' }
    assert_equal 1, reavaliacao.size
  end

  test 'does not include alerts from other accounts' do
    _, other_account = register_user
    other_contact    = create_contact(other_account)
    CoachingProfile.create!(account: other_account, contact: other_contact, last_feedback_at: nil)

    get api_v1_coaching_alerts_url(format: :json), headers: @headers
    assert_equal [], response.parsed_body['alerts']
  end
end
