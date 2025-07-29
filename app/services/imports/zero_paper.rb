module Imports
  class ZeroPaper < ApplicationService
    include ActionView::Helpers::NumberHelper

    COLUMN_NAMES = {
      TRANSACTION_TYPE: 0,
      DUE_DATE: 1,
      COMPETENCY_DATE: 2,
      NAME: 3,
      AMOUNT: 4,
      CATEGORY: 5,
      CONTACT: 6,
      PAID: 7,
      DESCRIPTION: 8,
      BANK_ACCOUNT: 9,
      DOCUMENT_NUMBER: 10,
      PAYMENT_METHOD: 11,
      COST_CENTER: 12,
      TAGS: 13
    }.freeze

    TRANSACTION_TYPES = {
      REVENUE: 'Recebimentos',
      FIXED_EXPENSE: 'Despesas fixas',
      VARIABLE_EXPENSE: 'Despesas variáveis',
      PAYROLL: 'Pessoas',
      TAX: 'Impostos',
      TRANSFER_IN: 'Transferências Entrada',
      TRANSFER_OUT: 'Transferências Saída'
    }.freeze

    PAYMENT_METHODS = {
      '' => :no_payment_method,
      nil => :no_payment_method,
      'Cartão de crédito' => :credit_card,
      'Cartão de Débito' => :debit_card,
      'Cheque' => :check,
      'Boleto bancário' => :bank_slip,
      'Dinheiro' => :cash,
      'Transferência bancária' => :bank_transfer,
      'Débito automático' => :direct_debit,
      'Promissória' => :promissory
    }.freeze

    def call
      import = context.import

      begin
        # Extract zero paper items from XLSX file
        import = extract_zero_paper_items(import:)

        # Reseta os dados de progresso do import
        reset_import_progress(import:)

        # Import transactions to database
        import_transactions_to_database(import:)

        # Atualiza o saldo das contas bancárias
        context.account.bank_accounts.each do |bank_account|
          bank_account.skip_publish!
          bank_account.update_balance!
        end

        # Atualiza o saldo da conta
        context.account.update_balance!

        # If the progress_number is equal to zero, the application did not read, therefore, it failed, otherwise it is terminated
        context.fail!(error: I18n.t('imports.create.fail_import')) if import.progress_number.zero?

        # Finaliza os dados da importação
        finish_import_progress(import:)

        # Reset counters
        context.account.reset_cache_counters

        # Set default bank account by grater balance
        context.account.set_default_bank_account_by_greater_balance

        # Reindex TSV_BODY column
        context.account.reindex_after_import!

        # Delete all items cached
        import.zero_paper_items.delete_all
      rescue StandardError => e
        Rails.logger.error(e)
        import.state = :failed
        import.save!
      end
    rescue StandardError => e
      Rails.logger.error(e)
    end

    private

    def import_transactions_to_database(import:)
      items_processed = 0
      transactions = []

      import.zero_paper_items.find_each do |zero_paper_item|
        # Incrementa o contador de items processados
        increment_import_progress(import:)
        items_processed += 1

        # constroi as transações com base no tipo da transação
        case strip_value(zero_paper_item.transaction_type)
        when strip_value(TRANSACTION_TYPES[:REVENUE])           # Se for um recebimento
          transactions << build_transaction(item: zero_paper_item, transaction_type: :revenue)
        when strip_value(TRANSACTION_TYPES[:FIXED_EXPENSE])     # Se for uma despesa fixa
          transactions << build_transaction(item: zero_paper_item, transaction_type: :fixed_expense)
        when strip_value(TRANSACTION_TYPES[:VARIABLE_EXPENSE])  # Se for uma despesa variável
          transactions << build_transaction(item: zero_paper_item, transaction_type: :variable_expense)
        when strip_value(TRANSACTION_TYPES[:PAYROLL])           # Se for uma transação de folha de pagamento / pessoas
          transactions << build_transaction(item: zero_paper_item, transaction_type: :payroll)
        when strip_value(TRANSACTION_TYPES[:TAX])               # Se for um imposto
          transactions << build_transaction(item: zero_paper_item, transaction_type: :tax)
        when strip_value(TRANSACTION_TYPES[:TRANSFER_OUT])      # Se for uma transferência de saída
          transactions << build_transfer_transaction(import:, item: zero_paper_item)
        when strip_value(TRANSACTION_TYPES[:TRANSFER_IN])       # Se for uma transferência de saída
          transaction = build_transfer_transaction_in(import:, item: zero_paper_item)
          transactions << transaction if transaction.present?
        else
          next
        end

        if (items_processed % 100).zero?
          ActiveRecord::Base.transaction do
            transactions.each do |t|
              t.skip_publish!
              t.without_auditing { t.save(validate: false) }
            end
            import.save!
          end
          transactions = []
        end
      end

      ActiveRecord::Base.transaction do
        transactions.each do |t|
          t.skip_publish!
          t.without_auditing { t.save(validate: false) }
        end if transactions.any?
        import.save!
      end
    end

    def extract_zero_paper_items(import:)
      # Import transfers
      import.file.open do |file|
        # Abre o arquivo da planilha
        workbook = SimpleXlsxReader.open(file)
        worksheet = workbook.sheets.first

        items = []
        worksheet.rows.each_with_index do |row, index|
          if index.zero?
            next if is_column_names_valid?(row:)

            import.message = 'Arquivo incompatível! Verifique se o aquivo está no formato original do ZeroPaper.'
            raise StandardError, import.message
          end

          # Build and add zero paper item to items
          items << build_zero_paper_item(import:, row:)
          if (index % 1000).zero?
            ZeroPaperItem.import!(items, validate: false)
            items = []
          end
        end

        ZeroPaperItem.import!(items, validate: false) if items.any?
      end

      # Recarrega o import
      import.reload
    end

    def build_zero_paper_item(import:, row:)
      import.zero_paper_items.new(
        transaction_type: strip_value(row[COLUMN_NAMES[:TRANSACTION_TYPE]]),
        due_date: extract_due_date(row:),
        competency_date: extract_competency_date(row:),
        name: extract_name(row:),
        amount: extract_amount(row:),
        category: extract_category_name(row:),
        contact: extract_contact_name(row:),
        cost_center: extract_cost_center_name(row:),
        paid: extract_paid(row:),
        description: extract_description(row:),
        document_number: extract_document_number(row:),
        payment_method: extract_payment_method(row:),
        bank_account: extract_bank_account_name(row:),
        tags: extract_tags(row:)
      )
    end

    def is_column_names_valid?(row:)
      strip_value(row[COLUMN_NAMES[:TRANSACTION_TYPE]]) == 'Tipo de Lancamento' &&
        strip_value(row[COLUMN_NAMES[:DUE_DATE]]) == 'Data Pagamento' &&
        strip_value(row[COLUMN_NAMES[:COMPETENCY_DATE]]) == 'Data Competencia' &&
        strip_value(row[COLUMN_NAMES[:NAME]]) == 'Descricao' &&
        strip_value(row[COLUMN_NAMES[:AMOUNT]]) == 'Valor' &&
        strip_value(row[COLUMN_NAMES[:CATEGORY]]) == 'Categoria' &&
        strip_value(row[COLUMN_NAMES[:CONTACT]]) == 'Recebido de/Pago a' &&
        strip_value(row[COLUMN_NAMES[:PAID]]) == 'Pago' &&
        strip_value(row[COLUMN_NAMES[:DESCRIPTION]]) == 'Detalhes' &&
        strip_value(row[COLUMN_NAMES[:BANK_ACCOUNT]]) == 'Conta' &&
        strip_value(row[COLUMN_NAMES[:DOCUMENT_NUMBER]]) == 'Numero do Documento' &&
        strip_value(row[COLUMN_NAMES[:PAYMENT_METHOD]]) == 'Forma de Pagamento' &&
        strip_value(row[COLUMN_NAMES[:COST_CENTER]]) == 'Centro de Custo' &&
        strip_value(row[COLUMN_NAMES[:TAGS]]) == 'Tags'
    end

    def reset_import_progress(import:)
      import.progress_total = import.zero_paper_items.count
      import.progress_number = 0
      import.state = :in_progress
      import.save!
    end

    def increment_import_progress(import:)
      import.progress_number = (import.progress_number + 1)
    end

    def finish_import_progress(import:)
      import.state = :done if context.success?
      import.save!
    end

    def extract_category_name(row:)
      category_name = strip_value(row[COLUMN_NAMES[:CATEGORY]])
      return nil if category_name.blank?

      category_name
    end

    def extract_category(item:)
      category_name = item.category
      return nil if category_name.blank?

      context.account.categories.find_or_create_by(name: category_name)
    end

    def extract_cost_center_name(row:)
      cost_center_name = strip_value(row[COLUMN_NAMES[:COST_CENTER]])
      return nil if cost_center_name.blank?

      cost_center_name
    end

    def extract_cost_center(item:)
      cost_center_name = item.cost_center
      return nil if cost_center_name.blank?

      context.account.cost_centers.find_or_create_by(name: cost_center_name)
    end

    def extract_contact_name(row:)
      contact_name = strip_value(row[COLUMN_NAMES[:CONTACT]])
      return nil if contact_name.blank?

      contact_name
    end

    def extract_contact(item:)
      contact_name = item.contact
      return nil if contact_name.blank?

      context.account.contacts.find_or_create_by(first_name: contact_name)
    end

    def extract_paid(row:)
      strip_value(row[COLUMN_NAMES[:PAID]]) == 'Sim'
    end

    def extract_name(row:)
      name = strip_value(row[COLUMN_NAMES[:NAME]])
      return nil if name.blank?

      name
    end

    def extract_description(row:)
      description = strip_value(row[COLUMN_NAMES[:DESCRIPTION]])
      return nil if description.blank?

      description
    end

    def extract_bank_account_name(row:)
      bank_account_name = strip_value(row[COLUMN_NAMES[:BANK_ACCOUNT]])
      return nil if bank_account_name.blank?

      bank_account_name
    end

    def extract_bank_account(item:)
      bank_account_name = item.bank_account
      return nil if bank_account_name.blank?

      context.account.bank_accounts.create_with(default: false).find_or_create_by(name: bank_account_name)
    end

    def exists_bank_account?(import:, item_in:)
      import.zero_paper_items.exists?(
        transaction_type: TRANSACTION_TYPES[:TRANSFER_OUT],
        due_date: item_in.due_date,
        name: item_in.name,
        amount: item_in.amount,
        paid: item_in.paid
      )
    end

    def extract_transfer_to(import:, item_out:)
      item_in = import.zero_paper_items.find_by(
        transaction_type: TRANSACTION_TYPES[:TRANSFER_IN],
        due_date: item_out.due_date,
        name: item_out.name,
        amount: item_out.amount,
        paid: item_out.paid,
        imported: false
      )

      item_out.update_column(:imported, true)
      return nil if item_in.blank?

      item_in.update_column(:imported, true)
      extract_bank_account(item: item_in)
    end

    def extract_due_date(row:)
      row[COLUMN_NAMES[:DUE_DATE]] { Date.current }
    end

    def extract_competency_date(row:)
      row[COLUMN_NAMES[:COMPETENCY_DATE]] { nil }
    end

    def extract_amount(row:)
      amount = row[COLUMN_NAMES[:AMOUNT]]
      return 0 if amount.to_s.strip.blank?

      amount
    end

    def extract_tags(row:)
      tags = strip_value(row[COLUMN_NAMES[:TAGS]])
      return nil if tags.blank?

      tags
    end

    def extract_document_number(row:)
      document_number = strip_value(row[COLUMN_NAMES[:DOCUMENT_NUMBER]])
      return nil if document_number.blank?

      document_number
    end

    def extract_payment_method(row:)
      payment_method = strip_value(row[COLUMN_NAMES[:PAYMENT_METHOD]])
      return :no_payment_method if payment_method.blank?

      PAYMENT_METHODS[payment_method] || :no_payment_method
    end

    def strip_value(value)
      val = value.to_s.strip
      return nil if val.blank?

      val
    end

    def build_transfer_transaction(import:, item:)
      transfer_to = extract_transfer_to(import:, item_out: item)

      item.update_column(:imported, true)

      context.account.transactions.new(
        bank_account: extract_bank_account(item:),
        transfer_to:,
        transaction_type: :transfer,
        due_date: item.due_date,
        name: item.name,
        amount_cents: number_with_precision(item.amount, precision: 2),
        amount_currency: context.account.default_currency,
        exchanged_amount_cents: number_with_precision(item.amount, precision: 2),
        exchanged_amount_currency: context.account.default_currency,
        paid: item.paid,
        import: context.import
      )
    end

    def build_transfer_transaction_in(import:, item:)
      return if exists_bank_account?(import:, item_in: item)

      item.update_column(:imported, true)

      context.account.transactions.new(
        bank_account: nil,
        transfer_to: extract_bank_account(item:),
        transaction_type: :transfer,
        due_date: item.due_date,
        name: item.name,
        amount_cents: number_with_precision(item.amount, precision: 2),
        amount_currency: context.account.default_currency,
        exchanged_amount_cents: number_with_precision(item.amount, precision: 2),
        exchanged_amount_currency: context.account.default_currency,
        paid: item.paid,
        import: context.import
      )
    end

    def build_transaction(item:, transaction_type:)
      item.update_column(:imported, true)

      transaction_params = {
        transaction_type:,
        bank_account: extract_bank_account(item:),
        category: extract_category(item:),
        contact: extract_contact(item:),
        cost_center: extract_cost_center(item:),
        due_date: item.due_date,
        competency_date: item.competency_date,
        name: item.name,
        amount_cents: number_with_precision(item.amount, precision: 2),
        amount_currency: context.account.default_currency,
        exchanged_amount_cents: number_with_precision(item.amount, precision: 2),
        exchanged_amount_currency: context.account.default_currency,
        paid: item.paid,
        description: item.description,
        document_number: item.document_number,
        payment_method: item.payment_method,
        import: context.import
      }

      transaction_params[:tag_list] = item.tags if item.tags.present?

      context.account.transactions.new(transaction_params)
    end
  end
end
