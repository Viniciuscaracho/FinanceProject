# frozen_string_literal: true

require 'test_helper'

module Integrations
  class PluggyItemSyncJobTest < ActiveSupport::TestCase
    setup do
      @user, @account = register_user
      @integration_store = create_sample_store
      @account_store = IntegrationStores::Pluggy.pluggy_account_store(@account.id)
    end

    test 'should successfully execute pluggy item job' do
      Integrations::PluggyItemSync.expects(:call).once.with(account_id: @account.id,
                                                            sync_type: RelationshipStore::SYNC_TYPES[:initial_sync]).returns(
                                                              OpenStruct.new(
                                                                success?: true
                                                              )
                                                            )
      Integrations::PluggyItemSyncJob.perform_now(@account.id, RelationshipStore::SYNC_TYPES[:initial_sync])
    end

    test 'should fail to execute pluggy accounts job' do
      Integrations::PluggyItemSync.expects(:call).once.with(account_id: @account.id,
                                                            sync_type: RelationshipStore::SYNC_TYPES[:initial_sync]).returns(
                                                              OpenStruct.new(
                                                                success?: false,
                                                                failure?: true,
                                                                error: 'error'
                                                              )
                                                            )
      result = assert_raises IntegrationError do
        Integrations::PluggyItemSyncJob.perform_now(@account.id, RelationshipStore::SYNC_TYPES[:initial_sync])
      end
      assert_equal 'error', result.message
    end
  end
end
