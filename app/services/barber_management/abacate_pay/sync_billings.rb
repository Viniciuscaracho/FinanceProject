# frozen_string_literal: true

module BarberManagement
  module AbacatePay
    # Consulta o AbacatePay e sincroniza o status de billings pendentes.
    # Usado como fallback quando o webhook não alcança o servidor (ex: localhost).
    # Em produção o webhook já faz isso automaticamente; este serviço é uma
    # garantia extra chamada quando o usuário retorna da página de pagamento.
    class SyncBillings < ApplicationService
      def call
        return unless Client.configured?

        remote_billings = fetch_remote_billings
        return if remote_billings.empty?

        remote_by_id = remote_billings.index_by { |b| b['id'] }

        pending_billings = context.account.pix_billings.pending
        pending_billings = pending_billings.where(billing_id: context.billing_id) if context.billing_id.present?

        synced = 0
        pending_billings.each do |local_billing|
          remote = remote_by_id[local_billing.billing_id]
          next unless remote

          remote_status = remote['status']
          next if remote_status == 'PENDING'

          HandleWebhook.call(
            event: remote,
            event_type: status_to_event(remote_status)
          )
          synced += 1
        end

        context.synced_count = synced
        Rails.logger.info "AbacatePay SyncBillings: #{synced} billing(s) sincronizado(s) para account #{context.account.id}"
      rescue AbacatePayError => e
        Rails.logger.error "AbacatePay SyncBillings: API error — #{e.message}"
        context.fail!(error: e.message)
      rescue StandardError => e
        Rails.logger.error "AbacatePay SyncBillings: erro — #{e.message}"
        context.fail!(error: e.message)
      end

      private

      def fetch_remote_billings
        Array(Client.get('/checkouts/list'))
      rescue StandardError => e
        Rails.logger.error "AbacatePay SyncBillings: falha ao buscar lista — #{e.message}"
        []
      end

      def status_to_event(status)
        case status.upcase
        when 'PAID'      then 'billing.paid'
        when 'EXPIRED'   then 'billing.expired'
        when 'CANCELLED' then 'billing.cancelled'
        else "billing.#{status.downcase}"
        end
      end
    end
  end
end
