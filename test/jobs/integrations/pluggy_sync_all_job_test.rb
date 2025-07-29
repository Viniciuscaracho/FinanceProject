# frozen_string_literal: true

require 'test_helper'

module Integrations
  class PluggySyncAllJobTest < ActiveSupport::TestCase
    setup do
      @user, @account = register_user
      @integration_store = create_sample_store
      @account_store = IntegrationStores::Pluggy.pluggy_account_store(@account.id)
    end

    test 'should successfully sync all' do
      params = { transactions: { query: { from: (Time.current - 7.days).strftime('%Y-%m-%d') }}}
      Integrations::PluggyItemSyncJob.expects(:perform_now).once.with(@account.id,
                                                                      RelationshipStore::SYNC_TYPES[:initial_sync])
      Integrations::PluggyAccountsSyncJob.expects(:perform_now).once.with(@account.id,
                                                                          RelationshipStore::SYNC_TYPES[:initial_sync])
      Integrations::PluggyTransactionsSyncJob.expects(:perform_now).once.with(@account.id,
                                                                              RelationshipStore::SYNC_TYPES[:initial_sync],
                                                                              params[:transactions])
      Integrations::PluggySyncAllJob.perform_now(@account.id, RelationshipStore::SYNC_TYPES[:initial_sync], params)
    end

    test 'should fail to sync all' do
      Integrations::PluggyItemSyncJob.expects(:perform_now).once.with(@account.id,
                                                                      RelationshipStore::SYNC_TYPES[:initial_sync])
      Integrations::PluggyAccountsSyncJob.expects(:perform_now).once.with(@account.id,
                                                                          RelationshipStore::SYNC_TYPES[:initial_sync])
      Integrations::PluggyTransactionsSyncJob.expects(:perform_now).once.with(@account.id,
                                                                              RelationshipStore::SYNC_TYPES[:initial_sync],
                                                                              {}).raises(
                                                                                IntegrationError.new('error')
                                                                              )
      result = assert_raises IntegrationError do
        Integrations::PluggySyncAllJob.perform_now(@account.id, RelationshipStore::SYNC_TYPES[:initial_sync])
      end
      assert_equal 'error', result.message
    end
  end
end
