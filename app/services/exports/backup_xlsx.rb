module Exports
  class BackupXlsx < ApplicationService
    def call
      p = Axlsx::Package.new
      wb = p.workbook
      wb.add_worksheet(name: I18n.t('policies.transactions.title')) do |sheet|
        # header columns
        sheet.add_row set_header.compact
        sheet.auto_filter = 'A1:M1'
        transactions = context.transactions.order(:transaction_type_cd, :due_date)
        export = context.export

        transfers = transactions.transfers
        transactions = transactions.where.not(id: transfers)

        update_export_progress(export, 0, transactions.count+transfers.count*2)

        #--- BODY
        transactions.find_each(batch_size: 500) do |transaction|
          increment_export_progress(export)

          row = set_row(transaction:, wb:)
          sheet.add_row(row.map { |it| it[:value] }, style: row.map { |it| it[:style] }, types: row.map do |it|
            it[:type]
          end)

          export.save if (export.progress_number % 100).zero?
        end

        export.save

        # transfers out
        transfers.find_each(batch_size: 500) do |transfer|
          increment_export_progress(export)

          row = set_row(transaction: transfer, wb:, type: I18n.t('exports.transfer_out'))
          sheet.add_row(row.map { |it| it[:value] }, style: row.map { |it| it[:style] }, types: row.map do |it|
            it[:type]
          end)

          export.save if (export.progress_number % 100).zero?
        end

        export.save

        # transfers in
        transfers.find_each(batch_size: 500) do |transfer|
          increment_export_progress(export)

          row = set_row(transaction: transfer, wb:, transfer_in: true, type: I18n.t('exports.transfer_in'))
          sheet.add_row(row.map { |it| it[:value] }, style: row.map { |it| it[:style] }, types: row.map do |it|
            it[:type]
          end)

          export.save if (export.progress_number % 100).zero?
        end

        export.save unless export.progress_number == export.progress_total

      end

      context.data = p.to_stream
    end

    def set_row(transaction:, wb:, transfer_in: false, type: nil)
      default_style = wb.styles.add_style alignment: { horizontal: :center, vertical: :center }
      format_mask_decimal_style = wb.styles.add_style alignment: { horizontal: :center, vertical: :center },
                                                      format_code: '#,##0.00'
      format_mask_date_style = wb.styles.add_style alignment: { horizontal: :center, vertical: :center },
                                                   format_code: 'dd/mm/yyyy'
      description_style = wb.styles.add_style alignment: { vertical: :center, wrap_text: true }, sz: 12,
                                              width: 25

      [
        { value: type.presence || I18n.t("enums.transaction_type.#{transaction.transaction_type}"), type: :string, style: default_style }, # A
        { value: transaction.due_date, type: :date, style: format_mask_date_style }, # B
        { value: transaction.competency_date, type: :date, style: format_mask_date_style }, # C
        { value: transaction.name, type: :string, style: default_style }, # D
        { value: transaction.exchanged_amount.to_f, type: :float, style: format_mask_decimal_style }, # E
        { value: transaction.category&.name, type: :string, style: default_style }, # F
        { value: transaction.contact&.name, type: :string, style: default_style }, # G
        { value: transaction.paid ? I18n.t('true') : I18n.t('false'), type: :string, style: default_style }, # H
        { value: transaction.description, type: :string, style: description_style }, # I
        { value: transfer_in ? transaction.transfer_to&.name : transaction.bank_account&.name, type: :string, style: default_style }, # J
        { value: transaction.document_number, type: :string, style: default_style }, # K
        { value: I18n.t("enums.payment_method.#{transaction.payment_method}"), type: :string, style: default_style }, # L
        { value: transaction.cost_center&.name, type: :string, style: default_style }, # M
        { value: transaction.tags.map(&:name).join(', '), type: :string, style: default_style } # N
      ]
    end

    def set_header
      [
        I18n.t('activerecord.attributes.transaction.transaction_type'), # A
        I18n.t('exports.due_date'), # B
        I18n.t('exports.competency_date'), # c
        I18n.t('activerecord.attributes.transaction.name'), # D
        I18n.t('exports.value'), # E
        I18n.t('activerecord.attributes.transaction.category_id'), # F
        I18n.t('exports.received_paid_at'), # G
        I18n.t('activerecord.attributes.transaction.paid'), # H
        I18n.t('activerecord.attributes.transaction.description'), # I
        I18n.t('policies.bank_accounts.title'), # J
        I18n.t('activerecord.attributes.transaction.document_number'), # K
        I18n.t('activerecord.attributes.transaction.payment_method'), # L
        I18n.t('activerecord.attributes.transaction.cost_center_id'), # M
        I18n.t('exports.tags') # N
      ]
    end

    def increment_export_progress(export)
      export.progress_number += 1
    end

    def update_export_progress(export, index, total)
      export.progress_number = index
      export.progress_total = total
      export.state = :in_progress
      export.save!
    end

  end
end
