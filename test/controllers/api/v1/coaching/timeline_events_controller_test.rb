# frozen_string_literal: true

require 'test_helper'

class Api::V1::Coaching::TimelineEventsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @contact        = create_contact(@account)
    @auth_token     = generate_auth_token(@user)
    @headers        = { 'Authorization' => "Bearer #{@auth_token}" }

    # Stub IA para não chamar Anthropic nos testes
    Coaching::StructureNoteService.any_instance.stubs(:call).returns(
      { sono: '8h', carga: 'leve', observacao: 'ótimo dia', proxima_acao: 'manter' }
    )
  end

  # --- autenticação ---

  test 'requires authentication on index' do
    get api_v1_coaching_contact_timeline_events_url(@contact, format: :json)
    assert_response :unauthorized
  end

  test 'requires authentication on create' do
    post api_v1_coaching_contact_timeline_events_url(@contact, format: :json),
         params: { raw_input: 'teste' }
    assert_response :unauthorized
  end

  # --- index ---

  test 'returns empty list when no events' do
    get api_v1_coaching_contact_timeline_events_url(@contact, format: :json), headers: @headers
    assert_response :success
    assert_equal [], response.parsed_body['events']
  end

  test 'returns events for contact in descending order' do
    e1 = TimelineEvent.create!(account: @account, contact: @contact, raw_input: 'first',  source: 'manual')
    e2 = TimelineEvent.create!(account: @account, contact: @contact, raw_input: 'second', source: 'manual')

    get api_v1_coaching_contact_timeline_events_url(@contact, format: :json), headers: @headers
    assert_response :success

    ids = response.parsed_body['events'].map { |e| e['id'] }
    assert_equal [e2.id, e1.id], ids
  end

  test 'filters by search query' do
    TimelineEvent.create!(account: @account, contact: @contact, raw_input: 'sono ruim', source: 'manual')
    TimelineEvent.create!(account: @account, contact: @contact, raw_input: 'treino ok',  source: 'manual')

    get api_v1_coaching_contact_timeline_events_url(@contact, format: :json),
        params: { q: 'sono' }, headers: @headers

    events = response.parsed_body['events']
    assert_equal 1, events.size
    assert_equal 'sono ruim', events.first['raw_input']
  end

  test 'does not return events from other contacts' do
    other = create_contact(@account)
    TimelineEvent.create!(account: @account, contact: other, raw_input: 'not mine', source: 'manual')

    get api_v1_coaching_contact_timeline_events_url(@contact, format: :json), headers: @headers
    assert_equal [], response.parsed_body['events']
  end

  test 'returns 404 for unknown contact' do
    get api_v1_coaching_contact_timeline_events_url(0, format: :json), headers: @headers
    assert_response :not_found
  end

  # --- create ---

  test 'creates event and returns structured fields' do
    assert_difference('TimelineEvent.count') do
      post api_v1_coaching_contact_timeline_events_url(@contact, format: :json),
           params: { raw_input: 'dormiu bem, treino leve' }, headers: @headers
    end

    assert_response :created
    body = response.parsed_body['event']
    assert_equal '8h',      body['sono']
    assert_equal 'leve',    body['carga']
    assert_equal 'ótimo dia', body['observacao']
    assert_equal 'manter',  body['proxima_acao']
    assert_equal 'dormiu bem, treino leve', body['raw_input']
  end

  test 'create returns 404 for unknown contact' do
    post api_v1_coaching_contact_timeline_events_url(0, format: :json),
         params: { raw_input: 'algo' }, headers: @headers
    assert_response :not_found
  end

  test 'event json includes expected keys' do
    post api_v1_coaching_contact_timeline_events_url(@contact, format: :json),
         params: { raw_input: 'teste' }, headers: @headers

    body = response.parsed_body['event']
    %w[id raw_input source sono carga observacao proxima_acao created_at].each do |key|
      assert body.key?(key), "Missing key: #{key}"
    end
  end
end
