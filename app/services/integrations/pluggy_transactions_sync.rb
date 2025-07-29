# frozen_string_literal: true

module Integrations
  # Fetch Pluggy transactions
  class PluggyTransactionsSync < PluggySyncBase
    def call
      context.endpoint = :transactions
      initialize_vars

      context.fail!(error: "Account #{context.account_id} not has accounts synced") if pluggy_accounts.count.zero?

      if @transaction_ids.blank?
        upsert_transactions
      else
        delete_transactions
      end
    end

    private

    def pluggy_accounts
      @pluggy_accounts ||= @account_store.relationship_stores.where(external_entity: :accounts)
    end

    def upsert_transactions
      pluggy_accounts.each do |relationship|
        # For each account relationship, we need to sync the transactions
        process_transactions(relationship)
      end

      @account_store.upsert_config({ last_transactions_sync: Time.current.to_s })
    end

    def delete_transactions
      # delete transactions that are in the list of transaction ids
      # we probably should change this for reconciliation purposes
      @account_store.relationship_stores.where(external_id: @transaction_ids).destroy_all
      @account_store.upsert_config({ last_transactions_deletion: Time.current.to_s })
    end

    def relationship_params(relationship)
      { uri: { account_id: relationship.external_id } }.merge(@params)
    end

    def process_transactions(relationship, next_page_result = nil)
      client_result = next_page_result || @account.pluggy_client(endpoint_key: @endpoint,
                                                                 params: relationship_params(relationship))

      context.fail!(error: client_result.error) if client_result.failure?

      if client_result.body[:results].blank? && client_result.has_more?
        Rails.logger.error("No transactions found for account #{@account.id}")
        return

      elsif client_result.body[:results].blank?
        return
      end

      upsert_result = upsert_relationships(response: client_result.body[:results], last_update: :updatedAt,
                                           tied_to: relationship)

      context.fail!(error: upsert_result.failed_data.map { |data| data[:error] }.join(', ')) if upsert_result.failure?

      # recursive call to process next page
      process_transactions(relationship, client_result.next.call) if client_result.has_more?
    end
  end
end
