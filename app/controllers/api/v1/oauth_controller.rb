# frozen_string_literal: true

module Api
  module V1
    class OauthController < ActionController::API
      def google_oauth_url
        # Gerar URL de autorização do Google
        client_id = ENV['GOOGLE_CLIENT_ID'] || 'test_client_id'
        redirect_uri = "#{request.base_url}/oauth/callback"
        scope = 'email profile'
        
        auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" +
                   "client_id=#{client_id}&" +
                   "redirect_uri=#{CGI.escape(redirect_uri)}&" +
                   "scope=#{CGI.escape(scope)}&" +
                   "response_type=code&" +
                   "access_type=offline&" +
                   "prompt=consent"
        
        render json: { auth_url: auth_url }
      end
    end
  end
end 