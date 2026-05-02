# frozen_string_literal: true

module Transactions
  # Serviço para estender uma recorrência que está chegando ao fim
  class ExtendRecurrence < ApplicationService
    MAX_RECURRENCE_MONTHS = 12

    def call
      ApplicationRecord.transaction do
        payment_plan = context.payment_plan
        return context.fail!(message: 'Plano de pagamento não encontrado') unless payment_plan
        return context.fail!(message: 'Este não é um plano de recorrência') unless payment_plan.recurring?

        # Buscar a última transação do plano
        last_transaction = payment_plan.transactions.order(:installment_number).last
        return context.fail!(message: 'Nenhuma transação encontrada') unless last_transaction

        # Criar novas transações para os próximos 12 meses
        (1..MAX_RECURRENCE_MONTHS).each do |month_offset|
          due_date = CalculationsHelper.calculate_due_date(
            due_date: last_transaction.due_date,
            frequency: payment_plan.frequency.to_sym,
            number: month_offset
          )

          new_installment_number = payment_plan.transactions.maximum(:installment_number).to_i + month_offset

          payment_plan.transactions.create!(
            name: last_transaction.name,
            description: last_transaction.description,
            amount_cents: last_transaction.amount_cents,
            amount_currency: last_transaction.amount_currency,
            transaction_type_cd: last_transaction.transaction_type_cd,
            due_date: due_date,
            paid_at: nil,
            category_id: last_transaction.category_id,
            cost_center_id: last_transaction.cost_center_id,
            contact_id: last_transaction.contact_id,
            bank_account_id: last_transaction.bank_account_id,
            payment_method_cd: last_transaction.payment_method_cd,
            payment_type_cd: last_transaction.payment_type_cd,
            paid: false,
            competency_date: nil,
            document_number: nil,
            payment_plan_id: payment_plan.id,
            installment_number: new_installment_number,
            installment_total: new_installment_number,
            installment_type_cd: last_transaction.installment_type_cd
          )
        end

        # Atualizar número total de parcelas no payment_plan
        payment_plan.update!(number_of_installments: payment_plan.transactions.count)

        context.message = "Recorrência estendida por mais #{MAX_RECURRENCE_MONTHS} meses"
      end
    rescue => e
      Rails.logger.error "Erro ao estender recorrência: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      context.fail!(message: e.message)
    end
  end
end

