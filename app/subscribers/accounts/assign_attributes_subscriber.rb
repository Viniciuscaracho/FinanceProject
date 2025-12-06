
module Accounts
  # This subscriber is responsible for updating the bank account balance when a transaction is created.
  class AssignAttributesSubscriber < ApplicationSubscriber
    on_publish :subscription_upserted

    def on_subscription_upserted(event)
      subscription = event.payload.fetch(:record)
      return if subscription.blank?

      account = Account.find(subscription.account_id)
      return if account.blank?

      Account.with_advisory_lock("account:#{account.id}:assign_subscription_attributes") do
        # Sempre associar a subscription se ela for ativa ou em trial
        # Se for plan_primary, usar assign_subscription_attributes completo
        # Caso contrário, associar se for ativa e não houver subscription associada ou se a atual estiver cancelada
        if subscription.plan_primary?
          Rails.logger.info "Associando subscription plan_primary #{subscription.id} ao account #{account.id}"
          account.assign_subscription_attributes(subscription)
        elsif subscription.access_granted?
          # Se a subscription é ativa e não há subscription associada, ou a atual está cancelada/inativa
          current_sub = account.subscription
          if current_sub.blank? || !current_sub.access_granted?
            Rails.logger.info "Associando subscription ativa #{subscription.id} ao account #{account.id}"
            account.subscription_id = subscription.id
            account.subscription_status = subscription.status
            account.processor_plan_id = subscription.plan_id
            account.processor_plan_name = subscription.plan_nickname
          end
        end
        
        account.without_auditing { account.save! }
        Rails.logger.info "Account #{account.id} atualizado - subscription_id: #{account.subscription_id}, status: #{account.subscription_status}"
      end
    rescue StandardError => e
      Rails.logger.error "Erro no AssignAttributesSubscriber: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      raise e
    end
  end
end