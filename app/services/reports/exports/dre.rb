# frozen_string_literal: true

module Reports
  module Exports
    class Dre < ApplicationService

      def call
        params = context.params

        p = Axlsx::Package.new
        wb = p.workbook
        wb.add_worksheet(name: I18n.t('policies.transactions.title')) do |sheet|
          rows = set_rows(params:, wb:)

          rows.each do |row|
            sheet.add_row(row.map { |it| it[:value] },
                          style: row.map { |it| it[:style] },
                          types: row.map { |it| it[:type] })
          end

        end
        context.data = p.to_stream

      end

      def set_rows(params: {}, wb:)

        query = context.account.transactions.filter_by(**params)
        data = query.group(:transaction_type_cd).sum(:exchanged_amount_cents).to_h
        data = data.map { |k, v| [k, k.zero? ? v : -v] }.to_h

        gross_income = data.fetch(0, 0)
        taxes = data.fetch(4, 0)
        variable_expense = data.fetch(2, 0)
        fixed_expense = data.fetch(1, 0)
        payroll = data.fetch(3, 0)

        gross_profit = gross_income + taxes
        operating_profit = gross_profit + variable_expense
        result = operating_profit + payroll + fixed_expense

        default_style = wb.styles.add_style alignment: { horizontal: :center, vertical: :center }
        format_mask_decimal_style = wb.styles.add_style alignment: { horizontal: :center, vertical: :center },
                                                        format_code: '#,##0.00'

        rows = {
          I18n.t('reports.dre.gross_income') => gross_income,
          I18n.t('reports.dre.taxes') => taxes,
          I18n.t('reports.dre.gross_profit') => gross_profit,
          I18n.t('reports.dre.total_variable_expenses') => variable_expense,
          I18n.t('reports.dre.operating_profit') => operating_profit,
          I18n.t('reports.dre.total_fixed_expenses') => fixed_expense,
          I18n.t('reports.dre.payroll') => payroll,
          I18n.t('reports.dre.net_profit') => result
        }

        rows.map do |title, cents|
          [
            { value: title, type: :string, style: default_style },
            { value: Money.from_cents(cents), type: :integer, style: format_mask_decimal_style }
          ]
        end
      end

    end
  end
end
