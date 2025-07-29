# frozen_string_literal: true

module Integrations
  # Pluggy controller for integration
  class PluggyController < ApplicationController
    before_action :account_store, only: %i[status token]

    def status
      if connected?
        render json: { status: :connected }
      else
        render json: { status: :disconnected }
      end
    end

    def connect_token
      return render json: { message: 'Account already connected' }, status: :bad_request if connected?

      ActiveRecord::Base.connected_to(role: :writing) do
        result = current_account.pluggy_client(endpoint_key: :connect_token)
        if result.failure? || result.response.code != '200'
          render json: { error: result.error || result.body }, status: :unprocessable_entity
        else
          connect_token = { connect_token: result.body[:accessToken] }
          account_store.upsert_config(connect_token)
          render json: connect_token
        end
      end
    end

    def test_login
      # load the view located at app/views/integrations/pluggy/test_login.html.erb
      # I just want to render the view, not the layout
      render layout: false, template: 'integrations/pluggy/test_login'
    end

    private

    def connected?
      account_store.present? && account_store.config[:item_id].present?
    end

    def account_store
      ActiveRecord::Base.connected_to(role: :writing) do
        current_account.pluggy_store
      end
    end
  end
end
