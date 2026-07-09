# frozen_string_literal: true

require 'test_helper'

class Api::V1::Coaching::CoachingProfilesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @contact        = create_contact(@account)
    @auth_token     = generate_auth_token(@user)
    @headers        = { 'Authorization' => "Bearer #{@auth_token}" }
  end

  # --- show ---

  test 'requires authentication on show' do
    get api_v1_coaching_contact_coaching_profile_url(@contact, format: :json)
    assert_response :unauthorized
  end

  test 'show returns empty profile when none exists yet' do
    # show uses build (not save), so count does not change
    assert_no_difference('CoachingProfile.count') do
      get api_v1_coaching_contact_coaching_profile_url(@contact, format: :json), headers: @headers
    end
    assert_response :success
    assert_nil response.parsed_body.dig('profile', 'goal')
  end

  test 'show returns existing profile' do
    CoachingProfile.create!(account: @account, contact: @contact, goal: 'ganhar massa')

    get api_v1_coaching_contact_coaching_profile_url(@contact, format: :json), headers: @headers
    assert_response :success
    assert_equal 'ganhar massa', response.parsed_body.dig('profile', 'goal')
  end

  test 'show returns 404 for unknown contact' do
    get api_v1_coaching_contact_coaching_profile_url(0, format: :json), headers: @headers
    assert_response :not_found
  end

  test 'profile json includes expected keys' do
    get api_v1_coaching_contact_coaching_profile_url(@contact, format: :json), headers: @headers
    profile = response.parsed_body['profile']
    %w[id goal limitations next_reassessment_at last_feedback_at].each do |key|
      assert profile.key?(key), "Missing key: #{key}"
    end
  end

  # --- update ---

  test 'requires authentication on update' do
    patch api_v1_coaching_contact_coaching_profile_url(@contact, format: :json),
          params: { goal: 'novo objetivo' }
    assert_response :unauthorized
  end

  test 'update creates and sets fields when profile absent' do
    assert_difference('CoachingProfile.count') do
      patch api_v1_coaching_contact_coaching_profile_url(@contact, format: :json),
            params: { goal: 'emagrecer', limitations: 'joelho frágil' },
            headers: @headers
    end

    assert_response :success
    profile = response.parsed_body['profile']
    assert_equal 'emagrecer',    profile['goal']
    assert_equal 'joelho frágil', profile['limitations']
  end

  test 'update modifies existing profile' do
    CoachingProfile.create!(account: @account, contact: @contact, goal: 'antigo')

    patch api_v1_coaching_contact_coaching_profile_url(@contact, format: :json),
          params: { goal: 'novo' }, headers: @headers

    assert_response :success
    assert_equal 'novo', response.parsed_body.dig('profile', 'goal')
  end

  test 'update returns 404 for unknown contact' do
    patch api_v1_coaching_contact_coaching_profile_url(0, format: :json),
          params: { goal: 'x' }, headers: @headers
    assert_response :not_found
  end
end
