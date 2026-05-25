# frozen_string_literal: true

module StatementItems
  class BulkCreate < ApplicationService
    def call
      ofx = OFX(file)
      ofx.account.transactions.each { |trx| create_statement_item(trx) }
    rescue OFX::UnsupportedFileError => e
      context.fail!(message: I18n.t('errors.messages.unsupported_file', error: e.message))
    rescue StandardError => e
      context.fail!(message: I18n.t('errors.messages.unexpected_error', error: e.message))
    end

    private

    def create_statement_item(trx)
      suggested_transaction = find_suggested_transaction(trx)
      if suggested_transaction.present?
        create_with_suggested_transaction(trx, suggested_transaction)
      else
        create_new_statement_item(trx)
      end
    end

    def create_with_suggested_transaction(trx, suggested_transaction)
      statement_item = context.statement.statement_items.new(
        transaction_type: suggested_transaction.transaction_type,
        status: :suggested,
        type: translate_type(trx),
        posted_at: trx.posted_at,
        memo: trx.memo,
        due_date: suggested_transaction.due_date,
        name: suggested_transaction.name,
        document_number: trx.check_number,
        amount_cents: trx.amount_in_pennies.abs,
        amount_currency: 'BRL',
        related_transaction: suggested_transaction
      )

      case suggested_transaction.transaction_type_cd
      when 0, 1, 2, 3, 4
        statement_item.contact = suggested_transaction.contact
        statement_item.category = suggested_transaction.category
      else
        statement_item.bank_account_source = suggested_transaction.bank_account
        statement_item.bank_account_target = suggested_transaction.transfer_to
      end

      statement_item.save
    end

    def create_new_statement_item(trx)
      type = translate_type(trx)
      context.statement.statement_items.create(
        transaction_type: type == :credit ? :revenue : nil,
        status: :new,
        type:,
        posted_at: trx.posted_at,
        memo: trx.memo,
        due_date: trx.posted_at,
        name: trx.memo,
        document_number: trx.check_number,
        amount_cents: trx.amount_in_pennies.abs,
        amount_currency: 'BRL'
      )
    end

    def translate_type(trx)
      (trx.amount_in_pennies || 0).negative? ? :debit : :credit
    end

    def find_suggested_transaction(trx)
      due_date = trx.posted_at
      period = trx.posted_at.all_month
      amount_cents = trx.amount_in_pennies.abs

      query_base = context.statement.bank_account.transactions.by_type(type: translate_type(trx)).order(:due_date)

      query_search_param = extract_query_search_param(trx)

      suggested_transaction = query_base.find_by(due_date:, document_number: trx.check_number, amount_cents:)
      suggested_transaction ||= query_base.find_by(due_date: period, document_number: trx.check_number, amount_cents:)
      suggested_transaction ||= query_base.where(due_date:, amount_cents:).search_by_similarity(query_search_param).first
      suggested_transaction ||= query_base.where(due_date: period, amount_cents:).search_by_similarity(query_search_param).first
      suggested_transaction ||= query_base.find_by(due_date:, amount_cents:)
      suggested_transaction ||= query_base.find_by(due_date: period, amount_cents:)

      suggested_transaction
    end

    def extract_query_search_param(trx)
      query_search_param = trx.memo.downcase.strip
      query_search_param = query_search_param.gsub(/[^a-z\s]/, '')
      query_search_param.gsub(/\s+/, ' ')
    end

    def file
      context.statement.file.download.gsub('VERSION:100', 'VERSION:102')
    end
  end
end
