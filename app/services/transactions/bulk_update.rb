module Transactions
  class BulkUpdate < ApplicationService
    def call
      transactions = context.transactions
      params = context.params

      ActiveRecord::Base.transaction do
        context.transactions = transactions.map do |transaction|
          transaction.contact_id = params[:contact_id] if params[:contact_id].present?
          transaction.category_id = params[:category_id] if params[:category_id].present?
          transaction.cost_center_id = params[:cost_center_id] if params[:cost_center_id].present?
          transaction.tag_list = params[:tag_list] if params[:tag_list].present?
          transaction.save
          transaction
        end
      end

      failed_transactions = context.transactions.select { |transaction| transaction.errors.any? }
      if failed_transactions.any?
        first_error_transaction = failed_transactions.first
        return context.fail!(message: first_error_transaction.errors.full_messages.first)
      end

      set_feedback_message
    end

    private

    def set_feedback_message
      context.message = I18n.t('transactions.update.success')
    end
  end
end
