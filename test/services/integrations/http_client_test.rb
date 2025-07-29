# frozen_string_literal: true

require 'test_helper'

module Integrations
  class HttpClientTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @integration_store = create_sample_store
      @integration_store.upsert_config({
                                         api_key: 'test_key',
                                         host: 'https://test.host.com',
                                         allowed_hosts: %w[127.0.0.1 localhost]
                                       })
      @integration_store.upsert_endpoint(:test_endpoint, { method: Net::HTTP::Post::METHOD, uri: '/api/test' })
      @child_store = create_sample_child_store(@account, @integration_store)
    end

    test 'should do a simple endpoint call' do
      payload = { test: 'test' }
      expected_endpoint = 'https://test.host.com/api/test'
      expected_parsed_uri = URI.parse(expected_endpoint)
      Net::HTTP.expects(:new).with(expected_parsed_uri.host, expected_parsed_uri.port).returns(mock_http = mock)
      mock_http.expects(:use_ssl=).with(true)
      Net::HTTP::Post.expects(:new).with(expected_parsed_uri.request_uri).returns(mock_request = mock)
      mock_request.expects(:body=).with(payload.to_json)
      mock_http.expects(:verify_mode=).with(0)
      mock_request.expects(:add_field).with('Content-Type', 'application/json')
      mock_http.expects(:request).with(mock_request).returns(mock_response = mock)

      response = Integrations::HttpClient.call(integration_store: @integration_store, endpoint_key: :test_endpoint,
                                               payload:).response
      assert_equal mock_response, response
    end

    test 'should do a complex endpoint call' do
      @integration_store.upsert_endpoint(:test_endpoint, { method: Net::HTTP::Put::METHOD, uri: '/api/test/{{id}}' })
      payload = { test: 'test' }
      expected_endpoint = 'https://test.host.com/api/test/1?q=1&x=2'
      expected_parsed_uri = URI.parse(expected_endpoint)
      Net::HTTP.expects(:new).with(expected_parsed_uri.host, expected_parsed_uri.port).returns(mock_http = mock)
      mock_http.expects(:use_ssl=).with(true)
      Net::HTTP::Put.expects(:new).with(expected_parsed_uri.request_uri).returns(mock_request = mock)
      mock_request.expects(:body=).with(payload.to_json)
      mock_http.expects(:verify_mode=).with(0)
      mock_request.expects(:add_field).with('Content-Type', 'application/json')
      mock_request.expects(:add_field).with(:Authorization, 'Bearer token')
      mock_http.expects(:request).with(mock_request).returns(mock_response = mock)

      headers = { 'Authorization': 'Bearer token' }
      params = { query: { q: 1, x: 2 }, uri: { id: 1 } }
      response = Integrations::HttpClient.call(integration_store: @integration_store, endpoint_key: :test_endpoint,
                                               payload:, headers:, params:).response
      assert_equal mock_response, response
    end

    test 'should validate params' do
      params = { query: { q: 1, x: 2 }, uri: { id: 1 }, other: 1 }
      result = Integrations::HttpClient.call(integration_store: @integration_store, endpoint_key: :test_endpoint,
                                             params:)
      assert result.failure?
      assert_equal 'Allowed params are query or uri', result.error

      params = { query: 'a', uri: { id: 1 } }
      result = Integrations::HttpClient.call(integration_store: @integration_store, endpoint_key: :test_endpoint,
                                             params:)

      assert result.failure?
      assert_equal 'Query param must be a hash', result.error

      params = { query: { q: 1, x: 2 }, uri: 'a' }
      result = Integrations::HttpClient.call(integration_store: @integration_store, endpoint_key: :test_endpoint,
                                             params:)
      assert result.failure?
      assert_equal 'Uri param must be a hash', result.error
    end

    test 'should validate endpoint' do
      result = Integrations::HttpClient.call(integration_store: @integration_store, endpoint_key: :other_endpoint)
      assert result.failure?
      assert_equal 'Endpoint other_endpoint not found for integration pluggy', result.error

      @integration_store.upsert_endpoint(:test_endpoint, { method: Net::HTTP::Put::METHOD, uri: '/api/test/{{id}}' })
      result = Integrations::HttpClient.call(integration_store: @integration_store, endpoint_key: :test_endpoint)
      assert result.failure?
      assert_equal 'Param id not found for endpoint URI /api/test/{{id}}', result.error

      params = { uri: { id: '$ˆˆˆ$$' } }
      result = Integrations::HttpClient.call(integration_store: @integration_store, endpoint_key: :test_endpoint, params:)
      assert result.failure?
      assert_equal 'Endpoint https://test.host.com/api/test/$ˆˆˆ$$ is not a valid URL', result.error
    end
  end
end
