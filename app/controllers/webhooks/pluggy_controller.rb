# frozen_string_literal: true

module Webhooks
  # Handle Pluggy webhooks
  class PluggyController < Webhooks::ApplicationController

    def update
      # check if the webhooks is from a valid host
      if valid_host?
        # get the account id from the param id
        account_id = params[:id]

        # get the account from the account id
        account = Account.find(account_id)

        result = Integrations::PluggyHooks.call(account:, payload: params.to_unsafe_h)
        if result.success?
          head :ok
        else
          render json: { error: result.error }, status: :unprocessable_entity
        end
      else
        render json: { error: 'Invalid host' }, status: :forbidden
      end

    end

    private

    # check if the webhooks is from a valid host
    def valid_host?
      allowed_hosts = IntegrationStores::Pluggy.pluggy.config[:allowed_hosts]
      # check if the request host is in the allowed hosts
      allowed_hosts.include?(request.remote_ip)
    end
  end
end
