# frozen_string_literal: true

require 'test_helper'

module Integrations
  class PluggyHooksTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @integration_store = create_sample_store
      @account_store = IntegrationStores::Pluggy.pluggy_account_store(@account.id)
    end

    test 'should process hook and update config for waiting user input' do
      @payload = {
        event: 'item/waiting_user_input',
        eventId: SecureRandom.uuid,
        itemId: '1234'
      }
      result = Integrations::PluggyHooks.call(account: @account, payload: @payload)
      assert result.success?
      assert_equal true, @account_store.reload.config[:waiting_user_input]
      assert_equal @payload[:event],
                   @account_store.reload.relationship_stores.find_by(external_entity: :webhooks).raw_data[:event]
    end

    test 'should process hook and update config for login succeeded' do
      @payload = {
        event: 'item/login_succeeded',
        eventId: SecureRandom.uuid,
        itemId: '1234'
      }
      result = Integrations::PluggyHooks.call(account: @account, payload: @payload)
      assert result.success?
      assert_equal false, @account_store.reload.config[:waiting_user_input]
      assert_equal true, @account_store.reload.config[:login_succeeded]
      assert_equal @payload[:event],
                   @account_store.reload.relationship_stores.find_by(external_entity: :webhooks).raw_data[:event]
    end

    test 'should process hook and update config for item created' do
      @payload = {
        event: 'item/created',
        eventId: SecureRandom.uuid,
        itemId: '1234'
      }
      Integrations::PluggySyncAllJob.expects(:perform_later).with(@account.id,
                                                                  RelationshipStore::SYNC_TYPES[:initial_sync])
      result = Integrations::PluggyHooks.call(account: @account, payload: @payload)
      assert result.success?
      assert_equal @payload[:itemId], @account_store.reload.config[:item_id]
      assert_equal @payload[:event],
                   @account_store.reload.relationship_stores.find_by(external_entity: :webhooks).raw_data[:event]
    end

    test 'should process hook and update config for item updated' do
      @payload = {
        event: 'item/updated',
        eventId: SecureRandom.uuid,
        itemId: '1234'
      }
      params = { transactions: { query: { from: (Time.current - 7.days).strftime('%Y-%m-%d') } } }
      Integrations::PluggySyncAllJob.expects(:perform_later).with(@account.id,
                                                                  RelationshipStore::SYNC_TYPES[:webhook_sync], params)
      result = Integrations::PluggyHooks.call(account: @account, payload: @payload)
      assert result.success?
      assert_equal @payload[:event],
                   @account_store.reload.relationship_stores.find_by(external_entity: :webhooks).raw_data[:event]
    end

    test 'should process hook and update config for item deleted' do
      @payload = {
        event: 'item/deleted',
        eventId: SecureRandom.uuid,
        itemId: '1234'
      }
      # expects Time.current to be called with fixed date
      now = Time.current
      Time.stubs(:current).returns(now)
      result = Integrations::PluggyHooks.call(account: @account, payload: @payload)
      assert result.success?
      assert_nil @account_store.reload.config[:item_id]
      assert_equal now.to_s, @account_store.reload.config[:item_deleted_at]
      assert_equal @payload[:event],
                   @account_store.reload.relationship_stores.find_by(external_entity: :webhooks).raw_data[:event]
    end

    test 'should process hook and update config for transactions deleted' do
      @payload = {
        event: 'transactions/deleted',
        eventId: SecureRandom.uuid,
        itemId: '1234',
        transactionIds: ['1234']
      }
      # expects Time.current to be called with fixed date
      now = Time.current
      Time.stubs(:current).returns(now)
      Integrations::PluggyTransactionsSyncJob.expects(:perform_later).with(@account.id,
                                                                           RelationshipStore::SYNC_TYPES[:webhook_sync],
                                                                           {}, @payload[:transactionIds])
      result = Integrations::PluggyHooks.call(account: @account, payload: @payload)
      assert result.success?
      assert_equal now.to_s, @account_store.reload.config[:last_transactions_deletion]
      assert_equal @payload[:event],
                   @account_store.reload.relationship_stores.find_by(external_entity: :webhooks).raw_data[:event]
    end
  end
end
