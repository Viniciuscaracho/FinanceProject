# frozen_string_literal: true

module Integrations
  class HttpClient < ApplicationService
    def call
      initialize_vars
      request = create_http_request
      fill_request(request)
      context.response = @http.request(request)
    end

    private

    def initialize_vars
      @integration_store = context.integration_store
      @params = validate_params(context.params || {})
      @method, @endpoint = validate_endpoint(context.endpoint_key)
      @payload = context.payload || {}
      @headers = context.headers || {}
    end

    def create_http_request
      parsed_url = URI.parse(@endpoint)
      host = parsed_url.host
      port = parsed_url.port
      raise StandardError, "Unable to load endpoint: #{@endpoint}" unless host.present? && port.present?

      @http = Net::HTTP.new(host, port)
      @http.use_ssl = true if parsed_url.scheme == 'https'

      Net::HTTP.const_get(@method).new(parsed_url.request_uri)
    end

    def fill_request(request)
      request.body = @payload.to_json if @payload.present?
      request.add_field('Content-Type', 'application/json') if @headers['Content-Type'].blank?

      # add headers
      @headers.each do |key, value|
        request.add_field(key, value)
      end

      @http.verify_mode = OpenSSL::SSL::VERIFY_NONE if Rails.env.test? # disable SSL verification for test env
    end

    def valid_url?(url)
      URI.parse(url)
    rescue StandardError
      false
    end

    def validate_params(params)
      return {} if params.blank?

      context.fail!(error: 'Allowed params are query or uri') if (params.keys - %i[query uri]).present?
      context.fail!(error: 'Query param must be a hash') if params[:query].present? && !params[:query].is_a?(Hash)
      context.fail!(error: 'Uri param must be a hash') if params[:uri].present? && !params[:uri].is_a?(Hash)

      params
    end

    def validate_endpoint(endpoint_key)
      endpoint = @integration_store.endpoint(endpoint_key)
      if endpoint.blank?
        context.fail!(error: "Endpoint #{endpoint_key} not found for integration #{@integration_store.name}")
      end

      uri = validate_uri_params(endpoint[:uri], @params[:uri])

      # add query params to the URI if present
      # if uri already has query params, merge them
      if @params[:query].present?
        query_params = URI.encode_www_form(@params[:query])
        uri = if uri.include?('?')
                "#{uri}&#{query_params}"
              else
                "#{uri}?#{query_params}"
              end
      end

      final_url = @integration_store.endpoint_uri(uri)
      context.fail!(error: "Endpoint #{final_url} is not a valid URL") unless valid_url?(final_url)

      [endpoint[:method].titleize.to_sym, final_url]
    end

    def validate_uri_params(uri, params)
      uri.scan(/{{(.*?)}}/).flatten.each do |param|
        if params.blank? || params[param.to_sym].blank?
          context.fail!(error: "Param #{param} not found for endpoint URI #{uri}")
        end

        uri.gsub!("{{#{param}}}", params[param.to_sym].to_s)
      end
      uri
    end
  end
end
