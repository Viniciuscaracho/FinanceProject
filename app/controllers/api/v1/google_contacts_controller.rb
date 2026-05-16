# frozen_string_literal: true

module Api
  module V1
    class GoogleContactsController < ApplicationController
      CONTACTS_SCOPE = 'https://www.googleapis.com/auth/contacts.readonly'

      skip_before_action :authenticate_user!,        only: [:callback]
      skip_before_action :set_current_account,       only: [:callback]
      skip_before_action :create_or_refresh_session, only: [:callback]

      def status
        render json: { connected: Current.account.google_contacts_connected? }
      end

      def oauth_url
        state = build_state(Current.account)
        render json: { oauth_url: build_oauth_url(state) }
      end

      def callback
        return redirect_to "#{frontend_url}/contacts?google_contacts=error&reason=no_code" if params[:code].blank?

        account = decode_state(params[:state])
        return redirect_to "#{frontend_url}/contacts?google_contacts=error&reason=invalid_state" if account.nil?

        token_data = exchange_code(params[:code])
        return redirect_to "#{frontend_url}/contacts?google_contacts=error&reason=token_exchange" if token_data[:error]

        account.update_columns(
          google_contacts_access_token:     token_data[:access_token],
          google_contacts_refresh_token:    token_data[:refresh_token],
          google_contacts_token_expires_at: token_data[:expires_at],
          google_contacts_connected:        true
        )

        redirect_to "#{frontend_url}/contacts?google_contacts=connected"
      end

      def disconnect
        Current.account.update_columns(
          google_contacts_access_token:     nil,
          google_contacts_refresh_token:    nil,
          google_contacts_token_expires_at: nil,
          google_contacts_connected:        false
        )
        render json: { success: true }
      end

      # Proxy: busca contatos do Google e retorna lista padronizada
      def list
        account = Current.account
        return render json: { error: 'Google Contacts não conectado' }, status: :unprocessable_entity unless account.google_contacts_connected?

        token = valid_access_token(account)
        return render json: { error: 'Sessão expirada. Reconecte o Google.' }, status: :unauthorized if token.nil?

        contacts = fetch_google_contacts(token)
        render json: { contacts: contacts }
      rescue => e
        render json: { error: "Erro ao buscar contatos: #{e.message}" }, status: :internal_server_error
      end

      # Importa contatos selecionados como Contact no sistema
      def import
        account = Current.account
        contacts_data = params[:contacts]
        return render json: { error: 'Nenhum contato selecionado' }, status: :unprocessable_entity if contacts_data.blank?

        imported = 0
        skipped  = 0
        errors   = []

        contacts_data.each do |c|
          email = c[:email].to_s.strip.downcase.presence
          next if email && account.contacts.exists?(email: email)

          contact = account.contacts.build(
            first_name:   c[:name].to_s.split(' ', 2).first || 'Sem nome',
            last_name:    c[:name].to_s.split(' ', 2).last.presence,
            email:        email,
            phone_number: c[:phone].to_s.strip.presence,
            contact_type: :customer
          )

          if contact.save
            imported += 1
          else
            skipped += 1
            errors << { name: c[:name], error: contact.errors.full_messages.first }
          end
        end

        render json: { success: true, imported: imported, skipped: skipped, errors: errors }
      rescue => e
        render json: { error: "Erro ao importar: #{e.message}" }, status: :internal_server_error
      end

      private

      def fetch_google_contacts(token)
        url = 'https://people.googleapis.com/v1/people/me/connections' \
              '?personFields=names,emailAddresses,phoneNumbers&pageSize=1000'

        response = HTTParty.get(url, headers: { 'Authorization' => "Bearer #{token}" })
        body = response.parsed_response

        (body['connections'] || []).map do |person|
          name  = person.dig('names', 0, 'displayName') || ''
          email = person.dig('emailAddresses', 0, 'value') || ''
          phone = person.dig('phoneNumbers', 0, 'value') || ''
          { name: name, email: email, phone: phone }
        end.reject { |c| c[:name].blank? && c[:email].blank? }
      end

      def valid_access_token(account)
        expires_at = account.google_contacts_token_expires_at
        return account.google_contacts_access_token if expires_at.nil? || expires_at > 5.minutes.from_now

        refreshed = refresh_token(account)
        refreshed ? account.reload.google_contacts_access_token : nil
      end

      def refresh_token(account)
        response = HTTParty.post(
          'https://oauth2.googleapis.com/token',
          body: {
            client_id:     ENV.fetch('GOOGLE_CLIENT_ID'),
            client_secret: ENV.fetch('GOOGLE_CLIENT_SECRET'),
            refresh_token: account.google_contacts_refresh_token,
            grant_type:    'refresh_token'
          }
        )
        body = response.parsed_response
        return false if body['error']

        account.update_columns(
          google_contacts_access_token:     body['access_token'],
          google_contacts_token_expires_at: Time.current + body['expires_in'].to_i.seconds
        )
        true
      rescue
        false
      end

      def build_oauth_url(state)
        'https://accounts.google.com/o/oauth2/v2/auth?' + URI.encode_www_form(
          client_id:     ENV.fetch('GOOGLE_CLIENT_ID'),
          redirect_uri:  contacts_callback_url,
          scope:         CONTACTS_SCOPE,
          response_type: 'code',
          access_type:   'offline',
          prompt:        'consent',
          state:         state
        )
      end

      def contacts_callback_url
        "#{request.base_url}/api/v1/google_contacts/callback"
      end

      def build_state(account)
        payload = { account_id: account.id, exp: 10.minutes.from_now.to_i }
        JWT.encode(payload, jwt_secret, 'HS256')
      end

      def decode_state(state)
        return nil if state.blank?

        payload = JWT.decode(state, jwt_secret, true, algorithm: 'HS256').first
        Account.find_by(id: payload['account_id'])
      rescue JWT::DecodeError
        nil
      end

      def exchange_code(code)
        response = HTTParty.post(
          'https://oauth2.googleapis.com/token',
          body: {
            code:          code,
            client_id:     ENV.fetch('GOOGLE_CLIENT_ID'),
            client_secret: ENV.fetch('GOOGLE_CLIENT_SECRET'),
            redirect_uri:  contacts_callback_url,
            grant_type:    'authorization_code'
          }
        )
        body = response.parsed_response
        return { error: body['error_description'] || body['error'] } if body['error']

        {
          access_token:  body['access_token'],
          refresh_token: body['refresh_token'],
          expires_at:    Time.current + body['expires_in'].to_i.seconds
        }
      rescue => e
        { error: e.message }
      end

      def jwt_secret
        Rails.application.secret_key_base
      end

      def frontend_url
        ENV.fetch('FRONTEND_URL', 'http://localhost:5173')
      end
    end
  end
end
