# frozen_string_literal: true

module Subscriptions
  class Upsert < ApplicationService
      def call
        processor_id = context.stripe_subscription.id
        Subscription.with_advisory_lock("subscription:#{processor_id}:upsert") do
          context.subscription = context.account.subscriptions.find_or_initialize_by(processor_id:)
          was_new = context.subscription.new_record?
          sync_result = context.subscription.sync!(context.stripe_subscription)
          
          Rails.logger.info "Subscriptions::Upsert - Account #{context.account.id}:"
          Rails.logger.info "  processor_id: #{processor_id}"
          Rails.logger.info "  subscription_id: #{context.subscription.id}"
          Rails.logger.info "  was_new: #{was_new}"
          Rails.logger.info "  status: #{context.subscription.status}"
          Rails.logger.info "  sync_result: #{sync_result}"
          
          return if sync_result
        end

        add_fail_message(context.subscription)
      end
  end
end
