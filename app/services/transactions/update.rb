# frozen_string_literal: true

module Transactions
  class Update < ApplicationService
    def call
      context.transaction.assign_attributes(transaction_params)
      return set_feedback_message unless context.transaction.changed?
      return update_current_transaction if context.transaction.on_cash? || !show_update_dialog?

      # Quando o usuário move uma transação de tipo
      context.option = :prev_and_next_installments if context.transaction.transaction_type_cd_changed?

      return set_show_update_dialog if context.option.blank?
      return set_feedback_message   unless context.transaction.valid?

      ActiveRecord::Base.transaction do
        case context.option.to_sym
        when :only_this_installment
          update_current_transaction
        when :this_and_next_installments
          update_next_installments
          update_current_transaction
        when :prev_and_next_installments
          update_sibling_installments
          update_current_transaction
        when :this_and_prev_installments
          update_prev_installments
          update_current_transaction
        else
          context.fail!(message: I18n.t('shared.invalid_option'))
        end
      end
    end

    private

    def show_update_dialog?
      context.transaction.changed.intersect?(Transaction.update_installment_attributes)
    end

    def update_prev_installments
      context.transaction.prev_transactions.each_with_index do |transaction, index|
        update_installment(transaction:, index: -(index + 1))
      end
    end

    def update_next_installments
      context.transaction.next_transactions.each_with_index do |transaction, index|
        update_installment(transaction:, index: (index + 1))
      end
    end

    def update_sibling_installments
      update_prev_installments
      update_next_installments
    end

    def update_installment(transaction:, index:)
      transaction.skip_publish!
      transaction.due_date = update_due_date(index:) if due_date_changed?
      transaction.assign_attributes(context.transaction.attributes.slice(*changed_attributes))
      transaction.save
    end

    def due_date_changed?
      context.transaction.due_date_changed?
    end

    def changed_attributes
      (context.transaction.changed - %w[due_date paid])
    end

    def update_due_date(index:)
      case context.transaction.installment_type
      when :daily
        context.transaction.due_date + index.days
      when :weekly
        context.transaction.due_date + index.weeks
      when :biweekly
        context.transaction.due_date + (index * 2).weeks
      when :monthly
        context.transaction.due_date + index.months
      when :bimonthly
        context.transaction.due_date + (index * 2).months
      when :quarterly
        context.transaction.due_date + (index * 3).months
      when :semiannual
        context.transaction.due_date + (index * 6).months
      else
        context.transaction.due_date + index.years
      end
    end

    def set_show_update_dialog
      if show_update_dialog?
        context.show_update_dialog = true
      else
        set_feedback_message
      end
    end

    def update_current_transaction
      context.transaction.save
      set_feedback_message
    end

    def dispatch_event
      # # publish 'transaction_updated', transaction: context.transaction
    end

    def set_feedback_message
      if context.transaction.errors.any?
        context.fail!(message: context.transaction.errors.full_messages.first)
      else
        context.message = I18n.t('transactions.update.success')
      end
    end

    def transaction_params
      context.transaction_params.merge(secure_relationship_params)
    end

    def secure_relationship_params
      secure_params = {}

      contact_id = context.transaction_params[:contact_id]
      secure_params[:contact_id] = context.account.contacts.find_by(id: contact_id)&.id if contact_id.present?

      category_id = context.transaction_params[:category_id]
      secure_params[:category_id] = context.account.categories.find_by(id: category_id)&.id if category_id.present?

      cost_center_id = context.transaction_params[:cost_center_id]
      if cost_center_id.present?
        secure_params[:cost_center_id] =
          context.account.cost_centers.find_by(id: cost_center_id)&.id
      end

      if context.transaction.transfer?
        bank_accounts = context.account.bank_accounts

        bank_account_id = context.transaction_params.fetch(:bank_account_id, nil)
        secure_params[:bank_account_id] = bank_accounts.find_by(id: bank_account_id)&.id if bank_account_id

        transfer_to_id = context.transaction_params.fetch(:transfer_to_id, nil)
        secure_params[:transfer_to_id] = bank_accounts.find_by(id: transfer_to_id)&.id if transfer_to_id
      end

      secure_params
    end
  end
end
