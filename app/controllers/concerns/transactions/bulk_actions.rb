# frozen_string_literal: true

module Transactions
  module BulkActions
    def bulk_move_to
      authorize! :update, Transaction.new(transaction_type: @current_transaction_type)
      @transactions = current_account.transactions.find(params[:transaction_ids])

      @selected_bank_account = params[:selected_bank_account_id].to_i
      @selected_transaction_type = params[:selected_transaction_type].to_sym

      Transactions::BulkMoveTo.call(
        transactions: @transactions,
        params: {
          bank_account_id: @selected_bank_account,
          transaction_type: @selected_transaction_type
        }
      )
    end

    def bulk_move_to_options
      authorize! :update, Transaction.new(transaction_type: @current_transaction_type)
      @transactions = current_account.transactions.find(params[:transaction_ids])
    end

    def bulk_mark_as_paid
      authorize! :update, Transaction.new(transaction_type: @current_transaction_type)
      @transactions = current_account.transactions.where(id: params[:transaction_ids])

      ActiveRecord::Base.transaction do
        @transactions.update_all(paid: true)

        @transactions.each do |transaction|
          next unless transaction.detailed?

          transaction.children.update_all(paid: true)

          Transactions::AmountDetails::Save.call(
            transaction:,
            update_transaction_amount: true
          )
        end
      end

      publish 'transaction_updated', record: @transactions.first

      error = @transactions.any? { |transaction| transaction.errors.any? }

      respond_to do |format|
        if error
          flash.now.alert = I18n.t('transactions.mark_as_paid.error')
        else
          flash.now.notice = I18n.t('transactions.mark_as_paid.success')
        end

        format.turbo_stream
      end
    end

    def bulk_update_options
      authorize! :update, Transaction.new(transaction_type: @current_transaction_type)
      @transactions = current_account.transactions.find(params[:transaction_ids])
      @transaction_ids = []
      @sum_transactions = nil
      @count_transactions = 0
    end

    def bulk_update
      authorize! :update, Transaction.new(transaction_type: @current_transaction_type)
      @transactions = current_account.transactions.find(params[:transaction_ids])

      result = Transactions::BulkUpdate.call(
        transactions: @transactions,
        params: {
          category_id: params[:category_id],
          contact_id: params[:contact_id],
          cost_center_id: params[:cost_center_id],
          tag_list: params[:tag_list]
        },
        account: current_account
      )

      @transaction_ids = []
      @sum_transactions = nil
      @count_transactions = 0

      build_response(result:)
    end

    def bulk_destroy
      authorize! :destroy, Transaction.new(transaction_type: @current_transaction_type)
      @transactions_ids = params[:transaction_ids]

      result = Transactions::BulkDestroy.call(
        transactions_ids: params[:transaction_ids],
        option: :only_this_installment,
        account: current_account
      )

      @transactions = result.transactions
      build_response(result:)
    end

    def bulk_duplicate
      authorize! :update, Transaction.new(transaction_type: @current_transaction_type)
      @transactions = current_account.transactions.find(params[:transaction_ids])

      result = Transactions::BulkDuplicate.call(
        transactions: @transactions,
        account: current_account
      )

      @transactions = result.transactions
      build_response(result:)
    end
  end
end
