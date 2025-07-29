# frozen_string_literal: true

module Transactions
  # Class de serviço responsável por criar as transações recorrentes a partir de uma transação já existente
  class CreateRecurrence < ApplicationService
    def call
      ApplicationRecord.transaction do
        return context.fail!(message: context.transaction.errors.full_messages.first) unless context.transaction.valid?

        installment_total  = context.transaction.payment_plan.number_of_installments
        installment_type   = context.transaction.payment_plan.frequency
        payment_type       = context.transaction.payment_plan.type

        # returns if installment total is not greater than 1
        return unless installment_total > 1

        # Update current transaction
        context.transaction.assign_attributes(
          payment_type:,
          installment_number: 1,
          installment_total:,
          installment_type:
        )
        context.transaction.save

        # Return if error
        return context.fail!(message: context.transaction.errors.full_messages.first) if context.transaction.errors.any?

        # Create other transactions like current transaction
        (2..installment_total.to_i).each do |installment_number|
          transaction = context.transaction.dup.tap do |t|
            t.due_date = TransactionsHelper.calculate_due_date(
              transaction: context.transaction,
              installment_number: (installment_number - 1)
            )
            t.tag_list = context.transaction.tag_list
            t.installment_number = installment_number
            t.paid = false
            t.paid_at = nil
            t.document_number = nil
            t.competency_date = context.transaction.competency_date
            t.save
          end

          return context.fail!(message: transaction.errors.full_messages.first) if transaction.errors.any?
        end

        dispatch_event

        context.message = I18n.t('transactions.update.success')
      end
    end

    private

    def dispatch_event
      # # publish 'transaction_updated', transaction: context.transaction
    end
  end
end
