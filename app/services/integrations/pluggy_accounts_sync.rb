# frozen_string_literal: true

module Integrations
  # Fetch Pluggy accounts
  class PluggyAccountsSync < PluggySyncBase
    def call
      context.endpoint = :accounts
      initialize_vars
      process_accounts
      @account_store.upsert_config({ last_accounts_sync: Time.current.to_s })
    end

    private

    def process_accounts(next_page_result = nil)
      client_result = next_page_result || @account.pluggy_client(endpoint_key: @endpoint)
      context.fail!(error: client_result.error) if client_result.failure?

      upsert_result = upsert_relationships(response: client_result.body[:results], last_update: :updatedAt)

      context.fail!(error: upsert_result.failed_data.map { |data| data[:error] }.join(', ')) if upsert_result.failure?

      # recursive call to process next page
      process_accounts(client_result.next.call) if client_result.has_more?
    end
  end
end
