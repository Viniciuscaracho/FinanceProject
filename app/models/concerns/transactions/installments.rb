# frozen_string_literal: true

# This module is responsible for the constants of the Transaction model
module Transactions
  module Installments
    extend ActiveSupport::Concern

    included do
      attribute :_amount_cents_edited, :boolean, default: false
      attribute :_due_date_edited,     :boolean, default: false
    end

    def sibling_transactions
      payment_plan.transactions.where.not(id:).order(:installment_number)
    end

    def this_and_sibling_transactions
      payment_plan.transactions.order(:installment_number)
    end

    def next_transactions
      payment_plan.transactions.where('installment_number > ?', installment_number).order(:installment_number)
    end

    def this_and_next_transactions
      payment_plan.transactions.where('installment_number >= ?', installment_number).order(:installment_number)
    end

    def prev_transactions
      payment_plan.transactions.where('installment_number < ?', installment_number).order(:installment_number)
    end

    def this_and_prev_transactions
      payment_plan.transactions.where('installment_number <= ?', installment_number).order(:installment_number)
    end

    def prev_transaction?
      return false if payment_plan.blank?

      prev_transactions.exists?
    end

    def next_transaction?
      return false if payment_plan.blank?

      next_transactions.exists?
    end

    def sibling_transaction?
      return false if payment_plan.blank?

      sibling_transactions.exists?
    end

    def prev_and_next_transaction?
      return false if payment_plan.blank?

      prev_transaction? && next_transaction?
    end

    def show_update_dialog?
      recurring_or_installment? && changed?
    end

    def recurring_or_installment?
      recurring? || installment?
    end

    def destroy_this_and_prev_ones
      transactions_to_destroy = prev_transactions.load
      destroy_installments(transactions: transactions_to_destroy)
      destroy
      updated_installments = update_sibling_installments

      [transactions_to_destroy + [self], updated_installments]
    end

    def destroy_this_and_next_ones
      transactions_to_destroy = next_transactions.load
      destroy_installments(transactions: transactions_to_destroy)
      destroy
      updated_installments = update_sibling_installments

      [transactions_to_destroy + [self], updated_installments]
    end

    def destroy_this_and_others
      transactions_to_destroy = sibling_transactions.load
      destroy_installments(transactions: transactions_to_destroy)
      destroy
      payment_plan.destroy

      [transactions_to_destroy + [self], []]
    end

    def destroy_this_one
      destroy
      updated_installments = update_sibling_installments

      [[self], updated_installments]
    end

    protected

    def update_sibling_installments
      unless sibling_transaction?
        payment_plan&.destroy
        return []
      end

      update_installments(transactions: sibling_transactions.load)
    end

    def update_installments(transactions:)
      first_transaction = transactions.first
      return [] if first_transaction.blank?

      transactions_count = transactions.count
      if transactions_count == 1
        first_transaction.update(payment_type: :on_cash, payment_plan_id: nil)
        payment_plan.destroy
        return [first_transaction]
      end

      transactions.each_with_index do |t, index|
        t.update(
          installment_number: (index + 1),
          installment_total: transactions_count
        )
      end

      payment_plan.update(number_of_installments: transactions_count)

      transactions.reload
    end

    def destroy_installments(transactions:)
      transactions_to_destroy = transactions.load
      # destroy this and next ones
      transactions_to_destroy.each(&:skip_publish!)
      transactions_to_destroy.each(&:destroy)
    end
  end
end
