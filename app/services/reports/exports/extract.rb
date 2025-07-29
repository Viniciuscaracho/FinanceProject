# frozen_string_literal: true

module Reports
  module Exports
    class Extract < ApplicationService

      def call
        params = context.params

        bank_account_ids, cost_center_ids = set_params(params:)

        @previous_balance = set_previous_balance(params:, bank_account_ids:, cost_center_ids:)
        @balance = @previous_balance

        p = Axlsx::Package.new
        wb = p.workbook

        set_styles(wb:)

        wb.add_worksheet do |sheet|
          insert_title_row(sheet:, row: set_previous_balance_row)

          # blank row
          sheet.add_row

          transactions = set_transactions(params:)
          transfers_in = set_transfers_in(params:)

          add_row(sheet:, row: set_header_row)

          transactions.or(transfers_in).order(params[:date_type], :transaction_type_cd).each do |transaction|

            @balance = if transaction.revenue?
                         @balance + transaction.exchanged_amount_cents
                       else
                         @balance - transaction.exchanged_amount_cents
                       end

            row = set_row(transaction:)
            add_row(sheet:, row:)
          end

          # blank row
          sheet.add_row

          @total_revenues = transactions.revenues.sum(:exchanged_amount_cents) + transfers_in.sum(:exchanged_amount_cents)
          @total_expenses = -(transactions.expenses.sum(:exchanged_amount_cents) + transactions.transfers.sum(:exchanged_amount_cents))

          insert_title_row(sheet:, row: set_previous_balance_row)
          insert_title_row(sheet:, row: set_total_revenues_row)
          insert_title_row(sheet:, row: set_total_expenses_row)
          insert_title_row(sheet:, row: set_period_balance_row)
          insert_title_row(sheet:, row: set_final_balance_row)

        end

        context.data = p.to_stream
      end

      def set_previous_balance(params:, bank_account_ids:, cost_center_ids:)
        context.account.previous_balance_cents(
          date: params[:start_date],
          paid: true,
          bank_account_ids:,
          cost_center_ids:
        )
      end

      def set_params(params:)
        bank_account_ids = params.fetch(:bank_account_ids, []).reject(&:blank?)
        bank_account_ids = context.account.bank_account_ids if bank_account_ids.empty?

        cost_center_ids = params.fetch(:cost_center_ids, []).reject(&:blank?)

        [bank_account_ids, cost_center_ids]
      end

      def set_transfers_in(params:)
        transfers_in = if params[:bank_account_ids].blank? || params[:bank_account_ids]&.count == 1
                         context.account.transactions.transfers.by_paid(paid: params[:paid]).by_date_type(
                           start_date: params[:start_date],
                           end_date: params[:end_date],
                           date_type: params[:date_type]
                         )
                       else
                         context.account.transactions.transfers.by_paid(paid: params[:paid]).by_date_type(
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

        transfers_in
      end

      def insert_title_row(sheet:, row:)

        sheet.add_row(row.map { |it| it[:value] },
                      style: row.map { |it| it[:style] },
                      types: row.map { |it| it[:type] })

        sheet.merge_cells("A#{sheet.rows.count}:G#{sheet.rows.count}")
      end

      def set_previous_balance_row
        set_title_row(title: I18n.t('reports.extract.previous_balance'), value: @previous_balance)
      end

      def set_total_revenues_row
        set_title_row(title: I18n.t('reports.extract.total_revenues'), value: @total_revenues)
      end

      def set_total_expenses_row
        set_title_row(title: I18n.t('reports.extract.total_expenses'), value: @total_expenses)
      end

      def set_period_balance_row
        set_title_row(title: I18n.t('reports.extract.period_balance'), value: @total_revenues + @total_expenses)
      end

      def set_final_balance_row
        set_title_row(title: I18n.t('reports.extract.final_balance'), value: @balance)
      end

      def set_title_row(title:, value:)
        [
          { value: title, type: :string, style: @default_style_title },
          { value: '', type: :string, style: @default_style_title },
          { value: '', type: :string, style: @default_style_title },
          { value: '', type: :string, style: @default_style_title },
          { value: '', type: :string, style: @default_style_title },
          { value: '', type: :string, style: @default_style_title },
          { value: '', type: :string, style: @default_style_title },
          { value: Money.from_cents(value), type: :float, style: @format_mask_decimal_style_title }
        ]
      end

      def set_styles(wb:)
        @default_style_green =
          wb.styles.add_style alignment: { horizontal: :center, vertical: :center },
                              border: { style: :thin, color: '000000' },
                              bg_color: 'A8DCA2'

        @format_mask_decimal_green =
          wb.styles.add_style alignment: { horizontal: :center, vertical: :center },
                              border: { style: :thin, color: '000000' },
                              format_code: '#,##0.00',
                              bg_color: 'A8DCA2'

        @format_mask_date_style_green =
          wb.styles.add_style alignment: { horizontal: :center, vertical: :center },
                              border: { style: :thin, color: '000000' },
                              format_code: 'dd/mm/yyyy',
                              bg_color: 'A8DCA2'

        @default_style_red =
          wb.styles.add_style alignment: { horizontal: :center, vertical: :center },
                              border: { style: :thin, color: '000000' },
                              bg_color: 'F0BAB5'

        @format_mask_decimal_red =
          wb.styles.add_style alignment: { horizontal: :center, vertical: :center },
                              border: { style: :thin, color: '000000' },
                              format_code: '#,##0.00',
                              bg_color: 'F0BAB5'

        @format_mask_date_style_red =
          wb.styles.add_style alignment: { horizontal: :center, vertical: :center },
                              border: { style: :thin, color: '000000' },
                              format_code: 'dd/mm/yyyy',
                              bg_color: 'F0BAB5'

        @default_style_title_gray =
          wb.styles.add_style alignment: { horizontal: :left, vertical: :center },
                              border: { style: :thin, color: '000000' },
                              bg_color: 'D9D9D9'

        @default_style_title =
          wb.styles.add_style alignment: { horizontal: :left, vertical: :center },
                              border: { style: :thin, color: '000000' },
                              bg_color: 'B9E4F7'

        @format_mask_decimal_style_title =
          wb.styles.add_style alignment: { horizontal: :center, vertical: :center },
                              border: { style: :thin, color: '000000' },
                              format_code: '#,##0.00',
                              bg_color: 'B9E4F7'
      end

      def set_transactions(params:)
        context.account.transactions.includes(:contact, :category, :bank_account, :transfer_to).filter_by(**params)
      end

      def set_header_row
        [
          { value: I18n.t('activerecord.attributes.transaction.paid'), type: :string, style: @default_style_title_gray },
          { value: I18n.t('activerecord.attributes.transaction.due_date'), type: :string, style: @default_style_title_gray },
          { value: I18n.t('activerecord.attributes.transaction.description'), type: :string, style: @default_style_title_gray },
          { value: I18n.t('activerecord.attributes.transaction.contact_id'), type: :string, style: @default_style_title_gray },
          { value: I18n.t('activerecord.attributes.transaction.category_id'), type: :string, style: @default_style_title_gray },
          { value: I18n.t('activerecord.attributes.transaction.bank_account_id'), type: :string, style: @default_style_title_gray },
          { value: I18n.t('activerecord.attributes.transaction.exchanged_amount'), type: :string, style: @default_style_title_gray },
          { value: I18n.t('reports.extract.balance'), type: :string, style: @default_style_title_gray }
        ]
      end

      def set_row(transaction:)

        exchanged_amount_cents =
          transaction.revenue? ? transaction.exchanged_amount_cents : -transaction.exchanged_amount_cents

        default_style = transaction.revenue? ? @default_style_green : @default_style_red
        format_mask_decimal_style = transaction.revenue? ? @format_mask_decimal_green : @format_mask_decimal_red
        format_mask_date_style = transaction.revenue? ? @format_mask_date_style_green : @format_mask_date_style_red

        [
          { value: transaction.paid ? I18n.t('true') : I18n.t('false'), type: :string, style: default_style },
          { value: transaction.due_date.to_date, type: :date, style: format_mask_date_style },
          { value: transaction.description, type: :string, style: default_style },
          { value: transaction.contact&.name, type: :string, style: default_style },
          { value: transaction.category&.name, type: :string, style: default_style },
          { value: transaction.bank_account&.name, type: :string, style: default_style },
          { value: Money.from_cents(exchanged_amount_cents), type: :integer, style: format_mask_decimal_style },
          { value: Money.from_cents(@balance), type: :float, style: format_mask_decimal_style }
        ]
      end

      def add_row(sheet:, row:)
        sheet.add_row(row.map { |it| it[:value] },
                      style: row.map { |it| it[:style] },
                      types: row.map { |it| it[:type] })
      end
    end
  end
end
