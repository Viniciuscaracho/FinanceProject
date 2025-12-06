module Reports
  class FinancialHistory < ApplicationService

    MONTH_SIZE = 31

    def call
      params = context.params

      # Otimização: usar select específico e limitar campos
      transactions = context.account.transactions
                            .select('transactions.*')
                            .filter_by(**params)

      unless transactions.any?
        # Retornar estrutura vazia se não houver transações
        chart_data = [
          { name: I18n.t('transactions.revenues.revenues', default: 'Receitas'), data: {} },
          { name: I18n.t('transactions.expenses.expenses', default: 'Despesas'), data: {} }
        ]
        items = {}
        total = { revenue: Money.from_cents(0), expense: Money.from_cents(0) }
        context.result = [chart_data, items, total]
        return
      end

      period = params[:start_date].to_date..params[:end_date].to_date

      if period.count > MONTH_SIZE

        period = transactions.order(params[:date_type])
        period = period.first&.date_by_type(date_type: params[:date_type])..period.last&.date_by_type(date_type: params[:date_type])

        revenues_hash = transactions.revenues.group_by_month(params[:date_type], time_zone: false,
range: period).sum(:exchanged_amount_cents)
        expenses_hash = transactions.expenses.group_by_month(params[:date_type], time_zone: false,
range: period).sum(:exchanged_amount_cents)

        revenues_hash = revenues_hash.map do |k, v|
          { k.strftime('%m/%Y') => v.to_f / 100 }
        end.reduce({}, :merge)

        expenses_hash = expenses_hash.map do |k, v|
          { k.strftime('%m/%Y') => v.to_f / 100 }
        end.reduce({}, :merge)

      else

        revenues_hash = transactions.revenues.days_with_amount_to_hash(date_type: params[:date_type])
        expenses_hash = transactions.expenses.days_with_amount_to_hash(date_type: params[:date_type])

        days_in_hash = period.map { |m| { m => 0 } }.reduce({}, :merge)

        revenues_hash = days_in_hash.merge(revenues_hash)
                                    .map { |k, v| { k => v.to_f / 100 } }.reduce({}, :merge)
        expenses_hash = days_in_hash.merge(expenses_hash)
                                    .map { |k, v| { k => v.to_f / 100 } }.reduce({}, :merge)
      end

      chart_data = [{ name: I18n.t('transactions.revenues.revenues'), data: revenues_hash },
                    { name: I18n.t('transactions.expenses.expenses'), data: expenses_hash }]

      items = revenues_hash.map { |k, v|
      { k.to_date.strftime(period.count > MONTH_SIZE ? '%m/%Y' : '%d/%m/%Y') => { revenue: v } } }.reduce({}, :merge).deep_merge(
        expenses_hash.map { |k, v|
      { k.to_date.strftime(period.count > MONTH_SIZE ? '%m/%Y' : '%d/%m/%Y') => { expense: v } } }.reduce({}, :merge))

      total = { revenue: Money.from_amount(revenues_hash.values.sum),
                expense: Money.from_amount(expenses_hash.values.sum) }

      context.result = [chart_data, items, total]
    end
  end
end
