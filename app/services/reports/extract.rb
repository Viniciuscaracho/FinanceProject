# frozen_string_literal: true

module Reports
  class Extract < ApplicationService
    def call
      params = context.params
      account = context.account

      bank_account_ids = params.fetch(:bank_account_ids, []).reject(&:blank?)
      bank_account_ids = context.account.bank_account_ids if bank_account_ids.empty?

      cost_center_ids = params.fetch(:cost_center_ids, []).reject(&:blank?)
      category_ids = params.fetch(:category_ids, []).reject(&:blank?)
      tag_ids = params.fetch(:tag_ids, []).reject(&:blank?)
      payment_methods = params.fetch(:payment_methods, []).reject(&:blank?)

      initial_balance = context.account.previous_balance_cents(
        date: params[:start_date],
        paid: true,
        bank_account_ids:,
        cost_center_ids:,
        category_ids:,
        tag_ids:,
        payment_methods:
      )

      @balance = initial_balance

      transactions = account.transactions.includes(:contact, :category, :bank_account, :transfer_to).filter_by(**params)

      # fazendo os filtros para as transferencias de entrada
      transfers_in = if params[:bank_account_ids].blank? || params[:bank_account_ids]&.count == 1
                       account.transactions.transfers.by_paid(paid: params[:paid]).by_date_type(
                         start_date: params[:start_date],
                         end_date: params[:end_date],
                         date_type: params[:date_type]
                       )
                     else
                       account.transactions.transfers.by_paid(paid: params[:paid]).by_date_type(
                         start_date: params[:start_date],
                         end_date: params[:end_date],
                         date_type: params[:date_type]
                       ).where(transfer_to_id: params[:bank_account_ids])
                     end
      if params[:cost_center_ids].reject(&:blank?).any?
        transfers_in = transfers_in.by_cost_center(cost_center_id: params[:cost_center_ids].map do |i|
          i == '-1' ? nil : i
        end)
      end

      if params[:category_ids].reject(&:blank?).any?
        transfers_in = transfers_in.where(category_id: params[:category_ids])
      end

      if params[:tag_list].reject(&:blank?).any?
        transfers_in = transfers_in.tagged_with(params[:tag_list], any: true)
      end

      if params[:payment_methods].reject(&:blank?).any?
        transfers_in = transfers_in.where(payment_method_cd: params[:payment_methods].map { |i| Transaction.payment_methods[i] })
      end

      # fazendo um each na união das transações e das transferencias de entrada
      # quando for uma transferencia, ele cria o card da saida quando o id da conta bancaria esta nos parametros
      # a mesma coisa para o car de entrada. Para que assim, quando selecionar apenas a conta que possui a transferencia
      # de entrada, só criar o card de entrada, para o saida é a mesma coisa

      items = []
      transactions.or(transfers_in).order(params[:date_type], :transaction_type_cd).each do |transaction|
        case transaction.transaction_type
        when :transfer
          if bank_account_ids.include?(transaction.bank_account&.id&.to_s)
            items << build_transfer_out(transfer: transaction)
          end
          if bank_account_ids.include?(transaction.transfer_to&.id&.to_s)
            items << build_transfer_in(transfer: transaction)
          end
        else
          items << build_default_transaction(transaction:)
        end
      end

      total_revenues = transactions.revenues.sum(:exchanged_amount_cents) + transfers_in.sum(:exchanged_amount_cents)
      total_expenses = transactions.expenses.sum(:exchanged_amount_cents) + transactions.transfers.sum(:exchanged_amount_cents)

      total = {
        previous_balance: initial_balance,
        final_balance: @balance,
        total_revenues:,
        total_expenses: -total_expenses,
        period_balance: total_revenues - total_expenses
      }

      context.result = [items, total]
    end

    def build_default_transaction(transaction:)
      {
        transaction:,
        transaction_type: transaction.transaction_type,
        date: I18n.l(transaction.date_by_type(date_type: context.params[:date_type])),
        paid: transaction.paid,
        description: transaction.name.presence || I18n.t('shared.not_informed_female'),
        contact: transaction.contact&.name || I18n.t('shared.not_informed'),
        category: transaction.category&.name || '',
        cost_center: transaction.cost_center&.name || '',
        payment_method: transaction.payment_method_name,
        document_number: transaction.document_number,
        value: transaction.revenue? ? transaction.exchanged_amount_cents : -transaction.exchanged_amount_cents,
        transfer_to: transaction.bank_account&.name || I18n.t('shared.not_informed_female'),
        balance: @balance += transaction.revenue? ? transaction.exchanged_amount_cents : -transaction.exchanged_amount_cents,
        bank_account_id: transaction.bank_account&.id,
        on_cash: transaction.on_cash?,
        payment_type: transaction.payment_type.name,
        installment_number: transaction.installment_number,
        installment_total: transaction.installment_total

      }
    end

    def build_transfer_out(transfer:)
      {
        transaction: transfer,
        transaction_type: transfer.transaction_type,
        date: I18n.l(transfer.date_by_type(date_type: context.params[:date_type])),
        paid: transfer.paid,
        description: transfer.name.presence || I18n.t('shared.not_informed_female'),
        contact: transfer.contact&.name || I18n.t('shared.not_informed'),
        category: transfer.category&.name || '',
        value: -transfer.exchanged_amount_cents,
        transfer_to: transfer.transfer_to&.name,
        balance: @balance -= transfer.exchanged_amount_cents,
        bank_account_id: transfer.bank_account&.id
      }
    end

    def build_transfer_in(transfer:)
      {
        transaction: transfer,
        transaction_type: transfer.transaction_type,
        date: I18n.l(transfer.date_by_type(date_type: context.params[:date_type])),
        paid: transfer.paid,
        description: transfer.name.presence || I18n.t('shared.not_informed_female'),
        contact: transfer.contact&.name || I18n.t('shared.not_informed'),
        category: transfer.category&.name || '',
        value: transfer.exchanged_amount_cents,
        transfer_in: true,
        transfer_to: transfer.bank_account&.name,
        balance: @balance += transfer.exchanged_amount_cents,
        bank_account_id: transfer.bank_account&.id
      }
    end
  end
end
