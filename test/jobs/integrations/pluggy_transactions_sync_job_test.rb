# frozen_string_literal: true

require 'test_helper'

module Integrations
  class PluggyTransactionsSyncJobTest < ActiveSupport::TestCase
    setup do
      @user, @account = register_user
      @integration_store = create_sample_store
      @account_store = IntegrationStores::Pluggy.pluggy_account_store(@account.id)
    end

    test 'should successfully execute pluggy transactions job' do
      params = { query: { from: (Time.current - 7.days).strftime('%Y-%m-%d') }}
      transaction_ids = [1, 2, 3]
      Integrations::PluggyTransactionsSync.expects(:call).once.with(account_id: @account.id,
                                                                    sync_type: RelationshipStore::SYNC_TYPES[:initial_sync],
                                                                    params:, transaction_ids:).returns(
                                                                      OpenStruct.new(
                                                                        success?: true
                                                                      )
                                                                    )
      Integrations::PluggyTransactionsSyncJob.perform_now(@account.id, RelationshipStore::SYNC_TYPES[:initial_sync], params, transaction_ids)
    end

    test 'should fail to execute pluggy accounts job' do
      Integrations::PluggyTransactionsSync.expects(:call).once.with(account_id: @account.id,
                                                                    sync_type: RelationshipStore::SYNC_TYPES[:initial_sync],
                                                                    params: {},
                                                                    transaction_ids: []).returns(
                                                                      OpenStruct.new(
                                                                        success?: false,
                                                                        failure?: true,
                                                                        error: 'error'
                                                                      )
                                                                    )
      result = assert_raises IntegrationError do
        Integrations::PluggyTransactionsSyncJob.perform_now(@account.id, RelationshipStore::SYNC_TYPES[:initial_sync])
      end
      assert_equal 'error', result.message
    end
  end
end
