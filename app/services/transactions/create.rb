# frozen_string_literal: true

module Transactions
  class Create < ApplicationService
    def call
      context.transaction = context.account.transactions.new(transaction_params)
      if use_transaction_type_in_category?
        context.transaction.transaction_type = context.transaction.category.transaction_type
      end

      context.transaction.save

      set_feedback_message
    end

    private

    def dispatch_event
      # publish('transaction_created', transaction: context.transaction)
      # event = Transactions::TransactionCreated.new(data: { transaction: context.transaction })
      # event_store.# publish(event, stream_name: "transactions/#{context.transaction.id}")
      # EventModelDispatcher.call(model: context.transaction, event: Transactions::TransactionCreated)
    end

    def use_transaction_type_in_category?
      return false unless context.grouped_expenses?
      return false unless context.transaction.expense?
      return false if context.transaction.category.blank?
      return false if context.transaction.category.transaction_type.blank?

      true
    end

    def set_feedback_message
      if context.transaction.errors.any?
        context.fail!(message: context.transaction.errors.full_messages.first)
      else
        context.message = I18n.t('transactions.create.success')
      end
    end

    def transaction_params
      merge_params = secure_relationship_params
      context.transaction_params
             .except(:bank_account_id, :contact_id, :category_id)
             .merge(merge_params)
    end

    def secure_relationship_params
      bank_accounts = context.account.bank_accounts
      {
        bank_account: bank_accounts.find_by(id: context.transaction_params.fetch(:bank_account_id)),
        transfer_to: bank_accounts.find_by(id: context.transaction_params.fetch(:transfer_to_id, nil)),
        contact: context.account.contacts.find_by(id: context.transaction_params.fetch(:contact_id, nil)),
        category: context.account.categories.find_by(id: context.transaction_params.fetch(:category_id, nil)),
        cost_center: context.account.cost_centers.find_by(id: context.transaction_params.fetch(:cost_center_id, nil))
      }
    end
  end
end
